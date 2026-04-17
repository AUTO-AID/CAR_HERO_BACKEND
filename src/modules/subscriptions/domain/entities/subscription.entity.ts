export class SubscriptionPlanEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly nameAr: string,
    public readonly price: number,
    public readonly durationDays: number,
    public readonly features: string[],
    public readonly featuresAr: string[],
    public readonly isActive: boolean,
    public readonly tier: string,
    public readonly sortOrder: number,
    public readonly description?: string,
    public readonly descriptionAr?: string,
    public readonly metadata?: Record<string, any>,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}

export class UserSubscriptionEntity {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly planId: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly status: 'active' | 'expired' | 'cancelled' | 'pending',
    public readonly amountPaid: number,
    public readonly autoRenew: boolean = true,
    public readonly cancelledAt?: Date,
    public readonly lastPaymentId?: string,
    public readonly metadata?: Record<string, any>,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  isActive(): boolean {
    return this.status === 'active' && this.endDate > new Date();
  }
}
