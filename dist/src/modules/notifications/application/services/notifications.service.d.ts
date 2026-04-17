import { Model } from 'mongoose';
import { NotificationDocument } from '../infrastructure/persistence/mongoose/schemas/notification.schema';
import { NotificationType } from '../../../../core/enums/status.enum';
import { NotificationsGateway } from './notifications.gateway';
import type { IBookingRepository } from '../bookings/domain/repositories/booking.repository.interface';
export interface CreateNotificationDto {
    recipientId: string;
    recipientType: string;
    title: string;
    body: string;
    type: NotificationType;
    data?: Record<string, any>;
}
export declare class NotificationsService {
    private notificationModel;
    private readonly gateway;
    private readonly bookingRepository;
    private readonly logger;
    constructor(notificationModel: Model<NotificationDocument>, gateway: NotificationsGateway, bookingRepository: IBookingRepository);
    createNotification(dto: CreateNotificationDto): Promise<NotificationDocument>;
    getNotifications(recipientId: string, page?: number, limit?: number): Promise<{
        notifications: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    getUnreadCount(recipientId: string): Promise<number>;
    markAsRead(id: string, userId: string): Promise<NotificationDocument | null>;
    markAllAsRead(recipientId: string): Promise<void>;
    handleBookingReminders(): Promise<void>;
}
