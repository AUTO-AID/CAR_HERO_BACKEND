export declare enum OrderStatus {
    PENDING = "pending",
    ACCEPTED = "accepted",
    PROVIDER_ASSIGNED = "provider_assigned",
    PROVIDER_EN_ROUTE = "provider_en_route",
    PROVIDER_ARRIVED = "provider_arrived",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    REJECTED = "rejected"
}
export declare enum BookingStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    NO_SHOW = "no_show"
}
export declare enum PaymentStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    FAILED = "failed",
    REFUNDED = "refunded"
}
export declare enum ProviderStatus {
    ONLINE = "online",
    OFFLINE = "offline",
    BUSY = "busy"
}
export declare enum SubscriptionStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    EXPIRED = "expired",
    CANCELLED = "cancelled"
}
export declare enum TransactionType {
    CREDIT = "credit",
    DEBIT = "debit",
    REFUND = "refund",
    LOYALTY_POINTS = "loyalty_points"
}
export declare enum NotificationType {
    ORDER_UPDATE = "order_update",
    BOOKING_REMINDER = "booking_reminder",
    PROMOTION = "promotion",
    CHAT_MESSAGE = "chat_message",
    SYSTEM = "system"
}
export declare enum ServiceCategory {
    ROADSIDE_ASSISTANCE = "roadside_assistance",
    TOWING = "towing",
    BATTERY = "battery",
    TIRE = "tire",
    FUEL = "fuel",
    LOCKOUT = "lockout",
    MAINTENANCE = "maintenance",
    CAR_WASH = "car_wash",
    OTHER = "other"
}
