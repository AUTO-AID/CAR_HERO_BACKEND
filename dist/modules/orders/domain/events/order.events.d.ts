export declare enum OrderEvents {
    CREATED = "order.created",
    STATUS_CHANGED = "order.status_changed",
    PROVIDER_ASSIGNED = "order.provider_assigned",
    CANCELLED = "order.cancelled",
    PAID = "order.paid"
}
export declare class OrderStatusChangedEvent {
    readonly orderId: string;
    readonly oldStatus: string;
    readonly newStatus: string;
    readonly orderNumber: string;
    readonly userId: string;
    readonly providerId?: string | undefined;
    constructor(orderId: string, oldStatus: string, newStatus: string, orderNumber: string, userId: string, providerId?: string | undefined);
}
