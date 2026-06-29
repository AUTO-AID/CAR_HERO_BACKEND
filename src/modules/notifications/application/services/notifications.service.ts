import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Connection, Model, Types } from 'mongoose';
import * as admin from 'firebase-admin';
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

type NotificationRecipientType = 'user' | 'provider' | 'admin';

interface NotificationRecipient {
  _id: Types.ObjectId;
  recipientType: NotificationRecipientType;
  pushEnabled: boolean;
  fcmToken?: string;
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
    private configService: ConfigService,
  ) {
    if (!admin.apps.length) {
      try {
        const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
        const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
        const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');
        
        if (projectId && clientEmail && privateKey) {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId,
              clientEmail,
              privateKey: privateKey.replace(/\\n/g, '\n'),
            }),
          });
          this.logger.log('Firebase Admin initialized successfully');
        } else {
          this.logger.warn('Firebase Admin credentials missing. Push notifications will be disabled.');
        }
      } catch (error) {
        this.logger.error(`Failed to initialize Firebase Admin: ${error.message}`);
      }
    }
  }

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
      recipientType: recipient.recipientType,
      title: dto.title,
      body: dto.body,
      type: dto.type,
      data: dto.data || {},
    });

    await this.deliverToRecipient(recipient, notification, dto.title, dto.body, {
      type: dto.type,
      ...(dto.data || {}),
    });

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
    const visibleFilter = {
      recipientId: new Types.ObjectId(recipientId),
      deliveryStatus: { $ne: 'scheduled' },
    };

    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find(visibleFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.notificationModel.countDocuments(visibleFilter).exec(),
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
      .countDocuments({
        recipientId: new Types.ObjectId(recipientId),
        isRead: false,
        deliveryStatus: { $ne: 'scheduled' },
      })
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
      {
        recipientId: new Types.ObjectId(recipientId),
        isRead: false,
        deliveryStatus: { $ne: 'scheduled' },
      },
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
    await this.insertNotificationsInChunks(docs);

    if (!isScheduled) {
      void this.deliverBroadcastInBatches(recipients, {
        campaignId,
        title: dto.title.trim(),
        body: dto.body.trim(),
        type: dto.type,
        data: { source: 'admin_broadcast', campaignId },
      });
    }

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
      { $sort: { createdAt: -1 } },
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
        totals: [{ $group: { _id: null, notifications: { $sum: 1 }, unread: { $sum: { $cond: [{ $and: [{ $eq: ['$isRead', false] }, { $ne: ['$deliveryStatus', 'scheduled'] }] }, 1, 0] } }, sent: { $sum: { $cond: [{ $eq: ['$deliveryStatus', 'sent'] }, 1, 0] } }, scheduled: { $sum: { $cond: [{ $eq: ['$deliveryStatus', 'scheduled'] }, 1, 0] } }, failed: { $sum: { $cond: [{ $eq: ['$deliveryStatus', 'failed'] }, 1, 0] } } } }],
        campaigns: [{ $match: { campaignId: { $exists: true, $ne: null } } }, { $group: { _id: '$campaignId' } }, { $count: 'count' }],
      } },
    ]).exec();
    const totals = stats?.totals?.[0] || { notifications: 0, unread: 0, sent: 0, scheduled: 0, failed: 0 };
    return { ...totals, campaigns: stats?.campaigns?.[0]?.count || 0 };
  }

  private async dispatchScheduledNotifications() {
    const now = new Date();
    const due = await this.notificationModel.find({ deliveryStatus: 'scheduled', scheduledAt: { $lte: now } }).lean().exec();
    if (!due.length) return;
    await this.notificationModel.updateMany({ _id: { $in: due.map((item) => item._id) } }, { $set: { deliveryStatus: 'sent', sentAt: now } }).exec();

    const recipients = await Promise.allSettled(due.map((item) => this.resolveRecipient(item.recipientId.toString(), item.recipientType)));
    await Promise.all(due.map(async (item, index) => {
      const resolved = recipients[index];
      if (resolved.status !== 'fulfilled') {
        this.logger.error(`Scheduled notification recipient resolution failed for ${item._id}: ${resolved.reason?.message || resolved.reason}`);
        await this.notificationModel.updateOne({ _id: item._id }, { $set: { deliveryStatus: 'failed' } }).exec();
        return;
      }

      const notification = { ...item, deliveryStatus: 'sent', sentAt: now };
      await this.deliverToRecipient(resolved.value, notification, item.title, item.body, {
        type: item.type,
        campaignId: item.campaignId,
        ...(item.data || {}),
      });
      const unreadCount = await this.getUnreadCount(resolved.value._id.toString());
      this.gateway.emitUnreadCount(resolved.value._id.toString(), unreadCount);
    }));
    this.logger.log(`Dispatched ${due.length} scheduled notifications`);
  }

  private async getAudienceRecipients(audience: string) {
    const users = this.connection.collection('users');
    const providers = this.connection.collection('providers');
    if (audience === 'providers') return this.getProviderRecipients();
    const userFilter = audience === 'premium' ? { isPremium: true, isActive: { $ne: false } } : { isActive: { $ne: false } };
    const userRecipients = (await users.find(userFilter, { projection: { _id: 1, 'preferences.notifications.push': 1, fcmToken: 1 } }).toArray()).map((item: any) => ({ _id: item._id, recipientType: 'user' as const, pushEnabled: item.preferences?.notifications?.push !== false, fcmToken: item.fcmToken }));
    if (audience !== 'all') return userRecipients;
    const providerRecipients = await this.getProviderRecipients();
    return [...userRecipients, ...providerRecipients];
  }

  private async getProviderRecipients() {
    const providers = await this.connection.collection('providers').find(
      { isActive: { $ne: false } },
      { projection: { phone: 1, fcmToken: 1 } },
    ).toArray();
    const phones = providers.map((item) => item.phone).filter(Boolean);
    const users = await this.connection.collection('users').find(
      { phoneNumber: { $in: phones }, accountType: 'provider', isActive: { $ne: false } },
      { projection: { _id: 1, phoneNumber: 1, 'preferences.notifications.push': 1, fcmToken: 1 } },
    ).toArray();
    return users.map((item: any) => {
      const providerInfo = providers.find(p => p.phone === item.phoneNumber);
      return {
        _id: item._id,
        recipientType: 'provider' as const,
        pushEnabled: item.preferences?.notifications?.push !== false,
        fcmToken: item.fcmToken || providerInfo?.fcmToken,
      };
    });
  }

  private async resolveRecipient(recipientId: string, recipientType: string): Promise<NotificationRecipient> {
    const id = new Types.ObjectId(recipientId);
    const users = this.connection.collection('users');
    if (recipientType === 'admin') {
      const adminUser = await this.connection.collection('admins').findOne({ _id: id, isActive: { $ne: false } });
      if (!adminUser) throw new NotFoundException('Admin recipient not found');
      return {
        _id: id,
        recipientType: 'admin',
        pushEnabled: true,
        fcmToken: adminUser.fcmToken,
      };
    }

    if (recipientType !== 'provider') {
      const user = await users.findOne({ _id: id, isActive: { $ne: false } });
      if (!user) throw new NotFoundException('User recipient not found');
      return { 
        _id: id,
        recipientType: 'user',
        pushEnabled: user?.preferences?.notifications?.push !== false,
        fcmToken: user?.fcmToken 
      };
    }
    const providers = this.connection.collection('providers');
    const provider = await providers.findOne({ _id: id });
    const user = provider?.phone
      ? await users.findOne({ phoneNumber: provider.phone, accountType: 'provider' })
      : await users.findOne({ _id: id, accountType: 'provider' });
    if (!user && !provider) throw new NotFoundException('Provider recipient not found');
    return {
      _id: user?._id || id,
      recipientType: 'provider',
      pushEnabled: user?.preferences?.notifications?.push !== false,
      fcmToken: user?.fcmToken || provider?.fcmToken
    };
  }

  private async insertNotificationsInChunks(docs: any[]) {
    if (!docs.length) return;
    const chunkSize = 1000;
    for (let i = 0; i < docs.length; i += chunkSize) {
      const chunk = docs.slice(i, i + chunkSize);
      await this.notificationModel.insertMany(chunk);
      await new Promise(resolve => setTimeout(resolve, 25));
    }
  }

  private async deliverBroadcastInBatches(
    recipients: NotificationRecipient[],
    payload: {
      campaignId: string;
      title: string;
      body: string;
      type: NotificationType;
      data?: Record<string, any>;
    },
  ) {
    const pushRecipients = recipients.filter((recipient) => recipient.pushEnabled);
    for (let i = 0; i < pushRecipients.length; i += 500) {
      const chunk = pushRecipients.slice(i, i + 500);
      await this.sendFcmMulticast(
        chunk.map((recipient) => recipient.fcmToken).filter(Boolean) as string[],
        payload.title,
        payload.body,
        {
          type: payload.type,
          campaignId: payload.campaignId,
          ...(payload.data || {}),
        },
      );

      chunk.forEach((recipient) => {
        this.gateway.sendToUser(recipient._id.toString(), payload);
      });

      await new Promise(resolve => setTimeout(resolve, 25));
    }
  }

  private async deliverToRecipient(
    recipient: NotificationRecipient,
    payload: any,
    title: string,
    body: string,
    data: Record<string, any> = {},
  ) {
    if (!recipient.pushEnabled) return;

    this.gateway.sendToUser(recipient._id.toString(), payload);

    if (!recipient.fcmToken || admin.apps.length === 0) return;

    try {
      await admin.messaging().send({
        token: recipient.fcmToken,
        notification: { title, body },
        data: this.toFirebaseData(data),
      });
    } catch (error) {
      this.logger.error(`FCM delivery failed for recipient ${recipient._id}: ${error.message}`);
    }
  }

  private async sendFcmMulticast(tokens: string[], title: string, body: string, data: Record<string, any>) {
    if (!tokens.length || admin.apps.length === 0) return;
    try {
      await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title, body },
        data: this.toFirebaseData(data),
      });
    } catch (error) {
      this.logger.error(`FCM broadcast delivery failed: ${error.message}`);
    }
  }

  private toFirebaseData(data: Record<string, any>) {
    return Object.fromEntries(
      Object.entries(data)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => [
          key,
          typeof value === 'string' ? value : JSON.stringify(value),
        ]),
    );
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }


}
