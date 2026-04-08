import { OrderStatus, PaymentStatus } from '../../../../common/enums/status.enum';

export class OrderEntity {
  constructor(
    public readonly id: string,
    public readonly orderNumber: string,
    public readonly userId: string,
    public readonly serviceId: string,
    public readonly status: OrderStatus,
    public readonly total: number,
    public readonly userLocation: { type: string; coordinates: number[] },
    public readonly providerId?: string,
    public readonly vehicleId?: string,
    public readonly serviceName?: string,
    public readonly servicePrice?: number,
    public readonly scheduledAt?: Date,
    public readonly isScheduled?: boolean,
    public readonly paymentStatus?: PaymentStatus,
    public readonly paymentMethod?: string,
    public readonly userNotes?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  /**
   * Generates a unique order number (logic can be moved to a service if complex)
   */
  static generateOrderNumber(): string {
    return `CH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  /**
   * Business logic: Check if order can be cancelled
   */
  canBeCancelled(): boolean {
    return [OrderStatus.PENDING, OrderStatus.ACCEPTED].includes(this.status);
  }
}
