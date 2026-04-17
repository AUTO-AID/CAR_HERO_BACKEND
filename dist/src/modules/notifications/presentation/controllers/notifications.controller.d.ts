import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getNotifications(userId: string, page?: number, limit?: number): Promise<any>;
    getUnreadCount(userId: string): Promise<{
        success: boolean;
        count: any;
    }>;
    markAsRead(userId: string, id: string): Promise<{
        success: boolean;
        data: any;
    }>;
    markAllAsRead(userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
