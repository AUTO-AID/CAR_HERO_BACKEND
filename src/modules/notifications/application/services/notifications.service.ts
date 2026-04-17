import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Notification, NotificationDocument } from '../infrastructure/persistence/mongoose/schemas/notification.schema';
import { NotificationType } from '../../../../core/enums/status.enum';
import { NotificationsGateway } from './notifications.gateway';
import type { IBookingRepository } from '../bookings/domain/repositories/booking.repository.interface';
import { Booking } from '../bookings/domain/entities/booking.entity';

export interface CreateNotificationDto {
  recipientId: string;
  recipientType: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private readonly gateway: NotificationsGateway,
    @Inject('IBookingRepository')
    private readonly bookingRepository: IBookingRepository,
  ) {}

  /**
   * Create and send an in-app notification
   */
  async createNotification(dto: CreateNotificationDto): Promise<NotificationDocument> {
    const notification = await this.notificationModel.create({
      recipientId: new Types.ObjectId(dto.recipientId),
      recipientType: dto.recipientType,
      title: dto.title,
      body: dto.body,
      type: dto.type,
      data: dto.data || {},
    });

    // Real-time delivery via WebSocket
    this.gateway.sendToUser(dto.recipientId, notification);

    // Update unread count for user
    const unreadCount = await this.getUnreadCount(dto.recipientId);
    this.gateway.emitUnreadCount(dto.recipientId, unreadCount);

    this.logger.log(`Notification created and sent to user ${dto.recipientId}`);
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

  /**
   * Cron Job: Send reminders for upcoming bookings
   * Runs every 15 minutes
   */
  @Cron('0 */15 * * * *')
  async handleBookingReminders() {
    this.logger.log('Checking for upcoming booking reminders...');
    
    // Find bookings starting in ~1 hour (between 45 and 60 minutes from now)
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const fortyFiveMinsFromNow = new Date(now.getTime() + 45 * 60 * 1000);

    // This is a simplified query; in a real app, you'd use a more precise range
    const upcomingBookings = await this.bookingRepository.findAll({
      status: 'confirmed',
      scheduledDate: { $gte: fortyFiveMinsFromNow, $lte: oneHourFromNow }
    });

    for (const booking of upcomingBookings.data as any[]) {
      const b = booking as Booking;
      // Send to user
      await this.createNotification({
        recipientId: b.user,
        recipientType: 'user',
        title: 'Booking Reminder 🚗',
        body: `Your booking ${b.bookingNumber} for ${b.serviceName} is starting in about an hour.`,
        type: NotificationType.REMINDER,
        data: { bookingId: b.id, bookingNumber: b.bookingNumber, type: 'booking' }
      });

      // Send to provider (if assigned)
      if (b.provider) {
        await this.createNotification({
          recipientId: b.provider,
          recipientType: 'provider',
          title: 'Upcoming Service Reminder 🛠️',
          body: `You have a service appointment ${b.bookingNumber} in one hour.`,
          type: NotificationType.REMINDER,
          data: { bookingId: b.id, bookingNumber: b.bookingNumber, type: 'booking' }
        });
      }
    }
  }
}
