import { OrderStatusChangedEvent } from '../../domain/events/order.events';
import { NotificationsService } from '../../../notifications/notifications.service';
export declare class OrderNotificationsListener {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    handleOrderStatusChanged(event: OrderStatusChangedEvent): Promise<void>;
    handleProviderAssigned(payload: {
        orderId: string;
        providerId: string;
        orderNumber: string;
    }): Promise<void>;
}
