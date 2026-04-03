import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getNotifications(user: any, page?: number, limit?: number): Promise<{
        notifications: (import("mongoose").Document<unknown, {}, import("../../database").NotificationDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../database").Notification & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
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
    markAsRead(id: string): Promise<import("../../database").NotificationDocument | null>;
    markAllAsRead(user: any): Promise<{
        message: string;
    }>;
}
