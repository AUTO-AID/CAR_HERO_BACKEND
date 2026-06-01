import { BadRequestException, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from '../../infrastructure/persistence/mongoose/schemas/notification.schema';
import { NotificationType } from '../../../../core/enums/status.enum';
import { NotificationsGateway } from '../../presentation/gateways/notifications.gateway';

export interface CreateNotificationDto {
  recipientId: string;
  recipientType: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, any>;
}

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name);
  private scheduleTimer?: NodeJS.Timeout;

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private readonly gateway: NotificationsGateway,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  onModuleInit() {
    this.scheduleTimer = setInterval(() => void this.dispatchScheduledNotifications(), 60_000);
  }

  onModuleDestroy() {
    if (this.scheduleTimer) clearInterval(this.scheduleTimer);
  }

  /**
   * Create and send an in-app notification
   */
  async createNotification(dto: CreateNotificationDto): Promise<NotificationDocument> {
    const recipient = await this.resolveRecipient(dto.recipientId, dto.recipientType);
    const notification = await this.notificationModel.create({
      recipientId: recipient._id,
      recipientType: dto.recipientType,
      title: dto.title,
      body: dto.body,
      type: dto.type,
      data: dto.data || {},
    });

    // Real-time delivery via WebSocket
    if (recipient.pushEnabled) this.gateway.sendToUser(recipient._id.toString(), notification);

    // Update unread count for user
    const unreadCount = await this.getUnreadCount(recipient._id.toString());
    this.gateway.emitUnreadCount(recipient._id.toString(), unreadCount);

    this.logger.log(`Notification created for user ${recipient._id.toString()}`);
    return notification;
  }

  /**
   * Get user's notifications (paginated)
   */
  async getNotifications(
    recipientId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find({ recipientId: new Types.ObjectId(recipientId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.notificationModel.countDocuments({ recipientId: new Types.ObjectId(recipientId) }).exec(),
    ]);

    return {
      notifications,
      total,
      page,
      limit,
    };
  }

  async getUnreadCount(recipientId: string): Promise<number> {
    return this.notificationModel
      .countDocuments({ recipientId: new Types.ObjectId(recipientId), isRead: false })
      .exec();
  }

  async markAsRead(id: string, userId: string): Promise<NotificationDocument | null> {
    const notification = await this.notificationModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), recipientId: new Types.ObjectId(userId) },
      { isRead: true, readAt: new Date() },
      { new: true }
    ).exec();

    if (notification) {
      const unreadCount = await this.getUnreadCount(userId);
      this.gateway.emitUnreadCount(userId, unreadCount);
    }

    return notification;
  }

  async markAllAsRead(recipientId: string): Promise<void> {
    await this.notificationModel.updateMany(
      { recipientId: new Types.ObjectId(recipientId), isRead: false },
      { isRead: true, readAt: new Date() },
    );
    this.gateway.emitUnreadCount(recipientId, 0);
  }

  async createBroadcast(dto: { audience: 'all' | 'users' | 'premium' | 'providers'; title: string; body: string; type: NotificationType; scheduledAt?: string }) {
    if (!['all', 'users', 'premium', 'providers'].includes(dto.audience)) throw new BadRequestException('Invalid notification audience');
    if (!dto.title?.trim() || !dto.body?.trim()) throw new BadRequestException('Notification title and body are required');
    if (!Object.values(NotificationType).includes(dto.type)) throw new BadRequestException('Invalid notification type');
    const recipients = await this.getAudienceRecipients(dto.audience);
    const campaignId = `NOTIF-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : undefined;
    const isScheduled = Boolean(scheduledAt && scheduledAt.getTime() > Date.now());
    const now = new Date();
    const docs = recipients.map((recipient) => ({
      recipientId: recipient._id,
      recipientType: recipient.recipientType,
      title: dto.title.trim(),
      body: dto.body.trim(),
      type: dto.type,
      campaignId,
      audience: dto.audience,
      deliveryStatus: isScheduled ? 'scheduled' : 'sent',
      scheduledAt,
      sentAt: isScheduled ? undefined : now,
      data: { source: 'admin_broadcast' },
    }));
    if (docs.length) await this.notificationModel.insertMany(docs);
    if (!isScheduled) recipients.filter((recipient) => recipient.pushEnabled).forEach((recipient) => this.gateway.sendToUser(recipient._id.toString(), { campaignId, title: dto.title, body: dto.body, type: dto.type }));
    return { campaignId, audience: dto.audience, recipients: docs.length, deliveryStatus: isScheduled ? 'scheduled' : 'sent', scheduledAt };
  }

  async getAdminHistory(page = 1, limit = 10, filters: any = {}) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 10));
    const match: any = { campaignId: { $exists: true, $ne: null } };
    if (filters.audience && filters.audience !== 'all') match.audience = filters.audience;
    if (filters.status && filters.status !== 'all') match.deliveryStatus = filters.status;
    if (filters.type && filters.type !== 'all') match.type = filters.type;
    if (filters.search) {
      const regex = new RegExp(this.escapeRegex(filters.search.trim()), 'i');
      match.$or = [{ title: regex }, { body: regex }, { campaignId: regex }];
    }
    const [result] = await this.notificationModel.aggregate([
      { $match: match },
      { $group: { _id: '$campaignId', title: { $first: '$title' }, body: { $first: '$body' }, type: { $first: '$type' }, audience: { $first: '$audience' }, deliveryStatus: { $first: '$deliveryStatus' }, scheduledAt: { $first: '$scheduledAt' }, sentAt: { $first: '$sentAt' }, createdAt: { $min: '$createdAt' }, recipients: { $sum: 1 }, readCount: { $sum: { $cond: ['$isRead', 1, 0] } } } },
      { $sort: { createdAt: -1 } },
      { $facet: { campaigns: [{ $skip: (safePage - 1) * safeLimit }, { $limit: safeLimit }], meta: [{ $count: 'total' }] } },
    ]).exec();
    const total = result?.meta?.[0]?.total || 0;
    return { campaigns: result?.campaigns || [], pagination: { page: safePage, limit: safeLimit, total, pages: Math.max(1, Math.ceil(total / safeLimit)) } };
  }

  async getAdminStats() {
    const [stats] = await this.notificationModel.aggregate([
      { $facet: {
        totals: [{ $group: { _id: null, notifications: { $sum: 1 }, unread: { $sum: { $cond: ['$isRead', 0, 1] } }, sent: { $sum: { $cond: [{ $ne: ['$deliveryStatus', 'scheduled'] }, 1, 0] } }, scheduled: { $sum: { $cond: [{ $eq: ['$deliveryStatus', 'scheduled'] }, 1, 0] } } } }],
        campaigns: [{ $match: { campaignId: { $exists: true, $ne: null } } }, { $group: { _id: '$campaignId' } }, { $count: 'count' }],
      } },
    ]).exec();
    const totals = stats?.totals?.[0] || { notifications: 0, unread: 0, sent: 0, scheduled: 0 };
    return { ...totals, campaigns: stats?.campaigns?.[0]?.count || 0 };
  }

  private async dispatchScheduledNotifications() {
    const due = await this.notificationModel.find({ deliveryStatus: 'scheduled', scheduledAt: { $lte: new Date() } }).lean().exec();
    if (!due.length) return;
    await this.notificationModel.updateMany({ _id: { $in: due.map((item) => item._id) } }, { $set: { deliveryStatus: 'sent', sentAt: new Date() } }).exec();
    const recipients = await Promise.all(due.map((item) => this.resolveRecipient(item.recipientId.toString(), item.recipientType)));
    due.forEach((item, index) => {
      if (recipients[index].pushEnabled) this.gateway.sendToUser(item.recipientId.toString(), item);
    });
    this.logger.log(`Dispatched ${due.length} scheduled notifications`);
  }

  private async getAudienceRecipients(audience: string) {
    const users = this.connection.collection('users');
    const providers = this.connection.collection('providers');
    if (audience === 'providers') return this.getProviderRecipients();
    const userFilter = audience === 'premium' ? { isPremium: true, isActive: { $ne: false } } : { isActive: { $ne: false } };
    const userRecipients = (await users.find(userFilter, { projection: { _id: 1, 'preferences.notifications.push': 1 } }).toArray()).map((item: any) => ({ _id: item._id, recipientType: 'user', pushEnabled: item.preferences?.notifications?.push !== false }));
    if (audience !== 'all') return userRecipients;
    const providerRecipients = await this.getProviderRecipients();
    return [...userRecipients, ...providerRecipients];
  }

  private async getProviderRecipients() {
    const providers = await this.connection.collection('providers').find(
      { isActive: { $ne: false } },
      { projection: { phone: 1 } },
    ).toArray();
    const phones = providers.map((item) => item.phone).filter(Boolean);
    const users = await this.connection.collection('users').find(
      { phoneNumber: { $in: phones }, accountType: 'provider', isActive: { $ne: false } },
      { projection: { _id: 1, 'preferences.notifications.push': 1 } },
    ).toArray();
    return users.map((item: any) => ({
      _id: item._id,
      recipientType: 'provider',
      pushEnabled: item.preferences?.notifications?.push !== false,
    }));
  }

  private async resolveRecipient(recipientId: string, recipientType: string) {
    const users = this.connection.collection('users');
    if (recipientType !== 'provider') {
      const user = await users.findOne({ _id: new Types.ObjectId(recipientId) });
      return { _id: new Types.ObjectId(recipientId), pushEnabled: user?.preferences?.notifications?.push !== false };
    }
    const providers = this.connection.collection('providers');
    const provider = await providers.findOne({ _id: new Types.ObjectId(recipientId) });
    const user = provider?.phone
      ? await users.findOne({ phoneNumber: provider.phone, accountType: 'provider' })
      : await users.findOne({ _id: new Types.ObjectId(recipientId), accountType: 'provider' });
    return {
      _id: user?._id || new Types.ObjectId(recipientId),
      pushEnabled: user?.preferences?.notifications?.push !== false,
    };
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }


}
