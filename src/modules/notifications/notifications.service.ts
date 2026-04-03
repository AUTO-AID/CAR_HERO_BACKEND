/**
 * Notifications Service
 * Handles push notifications via Firebase FCM
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as admin from 'firebase-admin';
import { Notification, NotificationDocument } from '../../database/schemas/notification.schema';
import { NotificationType } from '../../common/enums/status.enum';

export interface SendNotificationDto {
  recipientId: string;
  recipientType: 'user' | 'provider';
  title: string;
  body: string;
  type?: NotificationType;
  data?: Record<string, any>;
  imageUrl?: string;
  referenceType?: string;
  referenceId?: string;
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseInitialized = false;

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.initializeFirebase();
  }

  /**
   * Initialize Firebase Admin SDK
   */
  private async initializeFirebase(): Promise<void> {
    try {
      const projectId = this.configService.get<string>('firebase.projectId');
      const privateKey = this.configService.get<string>('firebase.privateKey');
      const clientEmail = this.configService.get<string>('firebase.clientEmail');

      if (projectId && privateKey && clientEmail) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            privateKey,
            clientEmail,
          }),
        });
        this.firebaseInitialized = true;
        this.logger.log('Firebase Admin SDK initialized');
      } else {
        this.logger.warn('Firebase credentials not configured');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Firebase', error);
    }
  }

  /**
   * Send push notification
   */
  async send(dto: SendNotificationDto, fcmToken?: string): Promise<NotificationDocument> {
    // Create notification record
    const notification = await this.notificationModel.create({
      recipientId: dto.recipientId,
      recipientType: dto.recipientType,
      title: dto.title,
      body: dto.body,
      type: dto.type || NotificationType.SYSTEM,
      data: dto.data,
      imageUrl: dto.imageUrl,
      referenceType: dto.referenceType,
      referenceId: dto.referenceId,
    });

    // Send FCM push notification if token provided and Firebase initialized
    if (fcmToken && this.firebaseInitialized) {
      try {
        await admin.messaging().send({
          token: fcmToken,
          notification: {
            title: dto.title,
            body: dto.body,
            imageUrl: dto.imageUrl,
          },
          data: dto.data
            ? Object.fromEntries(
                Object.entries(dto.data).map(([k, v]) => [k, String(v)]),
              )
            : undefined,
          android: {
            priority: 'high',
            notification: {
              channelId: 'default',
              priority: 'high',
            },
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
              },
            },
          },
        });

        notification.isPushSent = true;
        notification.pushSentAt = new Date();
        await notification.save();

        this.logger.log(`Push notification sent to ${dto.recipientId}`);
      } catch (error: any) {
        notification.pushError = error.message;
        await notification.save();
        this.logger.error(`Failed to send push notification: ${error.message}`);
      }
    }

    return notification;
  }

  /**
   * Get user's notifications
   */
  async getNotifications(
    recipientId: string,
    recipientType: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find({ recipientId, recipientType })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.notificationModel.countDocuments({ recipientId, recipientType }).exec(),
    ]);

    const unreadCount = await this.notificationModel
      .countDocuments({ recipientId, recipientType, isRead: false })
      .exec();

    return {
      notifications,
      total,
      page,
      limit,
      unreadCount,
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<NotificationDocument | null> {
    return this.notificationModel
      .findByIdAndUpdate(id, { isRead: true, readAt: new Date() }, { new: true })
      .exec();
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(recipientId: string, recipientType: string): Promise<void> {
    await this.notificationModel.updateMany(
      { recipientId, recipientType, isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }
}
