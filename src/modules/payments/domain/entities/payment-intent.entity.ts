export type PaymentPurpose = 'wallet_topup' | 'order_payment';
export type PaymentStatus = 'pending' | 'success' | 'failed';

export class PaymentIntent {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly amount: number,
    public readonly purpose: PaymentPurpose,
    public readonly status: PaymentStatus,
    public readonly currency: string = 'SYP',
    public readonly referenceId?: string,
    public readonly gatewayUrl?: string,
    public readonly targetId?: string, // e.g., orderId
    public readonly metadata?: Record<string, any>,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  static generateReferenceId(): string {
    return `CHAM-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  }
}
