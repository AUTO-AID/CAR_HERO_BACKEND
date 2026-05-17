/**
 * Order Status Enum
 * Defines the lifecycle states of an order
 */
export enum OrderStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  PROVIDER_ASSIGNED = 'provider_assigned',
  PROVIDER_EN_ROUTE = 'provider_en_route',
  PROVIDER_ARRIVED = 'provider_arrived',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

/**
 * Payment Status Enum
 */
export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

/**
 * Payment Method Enum
 */
export enum PaymentMethod {
  CASH = 'cash',
  WALLET = 'wallet',
  CARD = 'card',
  POINTS = 'points',
}

/**
 * Provider Status Enum (Runtime)
 */
export enum ProviderStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  BUSY = 'busy',
}

/**
 * Provider Registration Status Enum (Admin Workflow)
 */
export enum RegistrationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/**
 * Subscription Status Enum
 */
export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

/**
 * Payout Status Enum
 */
export enum PayoutStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

/**
 * Transaction Type Enum
 */
export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
  REFUND = 'refund',
  LOYALTY_POINTS = 'loyalty_points',
}

/**
 * Notification Type Enum
 */
export enum NotificationType {
  ORDER_CREATED = 'order_created',
  ORDER_UPDATED = 'order_updated',
  ORDER_CANCELLED = 'order_cancelled',
  NEW_MESSAGE = 'new_message',
  REMINDER = 'reminder',
  SYSTEM_ALERT = 'system_alert',
  INFO = 'info',
  ALERT = 'alert',
}

/**
 * Service Category Enum
 */
export enum ServiceCategory {
  ROADSIDE_ASSISTANCE = 'roadside_assistance',
  TOWING = 'towing',
  BATTERY = 'battery',
  TIRE = 'tire',
  FUEL = 'fuel',
  LOCKOUT = 'lockout',
  MAINTENANCE = 'maintenance',
  CAR_WASH = 'car_wash',
  OTHER = 'other',
}
