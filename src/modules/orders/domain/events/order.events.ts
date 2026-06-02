export enum OrderEvents {
  CREATED = 'order.created',
  STATUS_CHANGED = 'order.status_changed',
  PROVIDER_ASSIGNED = 'order.provider_assigned',
  CANCELLED = 'order.cancelled',
  PAID = 'order.paid',
  LOCATION_UPDATED = 'order.location_updated',
}

export class OrderLocationUpdatedEvent {
  constructor(
    public readonly orderId: string,
    public readonly providerId: string,
    public readonly coordinates: number[],
    public readonly recordedAt: Date,
    public readonly accuracy?: number,
    public readonly heading?: number,
    public readonly speed?: number,
  ) {}
}

export class OrderStatusChangedEvent {
  constructor(
    public readonly orderId: string,
    public readonly oldStatus: string,
    public readonly newStatus: string,
    public readonly orderNumber: string,
    public readonly userId: string,
    public readonly providerId?: string,
  ) {}
}
