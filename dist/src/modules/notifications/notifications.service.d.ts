import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
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
export declare class NotificationsService implements OnModuleInit {
    private notificationModel;
    private configService;
    private readonly logger;
    private firebaseInitialized;
    constructor(notificationModel: Model<NotificationDocument>, configService: ConfigService);
    onModuleInit(): Promise<void>;
    private initializeFirebase;
    send(dto: SendNotificationDto, fcmToken?: string): Promise<NotificationDocument>;
    getNotifications(recipientId: string, recipientType: string, page?: number, limit?: number): Promise<{
        notifications: (import("mongoose").Document<unknown, {}, NotificationDocument, {}, import("mongoose").DefaultSchemaOptions> & Notification & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        total: number;
        page: number;
        limit: number;
        unreadCount: number;
    }>;
    markAsRead(id: string): Promise<NotificationDocument | null>;
    markAllAsRead(recipientId: string, recipientType: string): Promise<void>;
}
