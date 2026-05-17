import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ISubscriptionRepository } from '../../domain/repositories/subscription.repository.interface';

export interface UpgradeSubscriptionCommand {
  userId: string;
  planId: string;
  paymentId?: string;
  autoRenew?: boolean;
  metadata?: Record<string, any>;
}

@Injectable()
export class UpgradeSubscriptionUseCase {
  constructor(
    @Inject(ISubscriptionRepository)
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  async execute(dto: UpgradeSubscriptionCommand) {
    const current = await this.subscriptionRepository.findUserActiveSubscription(dto.userId);
    if (!current) {
      throw new BadRequestException('No active subscription found');
    }
    if (current.planId === dto.planId) {
      throw new BadRequestException('User is already subscribed to this plan');
    }

    const plan = await this.subscriptionRepository.findPlanById(dto.planId);
    if (!plan || !plan.isActive) {
      throw new BadRequestException('Invalid or inactive subscription plan');
    }

    await this.subscriptionRepository.updateUserSubscription(current.id, {
      status: 'cancelled',
      cancelledAt: new Date(),
      autoRenew: false,
      metadata: { ...(current.metadata || {}), replacedByPlanId: plan.id },
    });

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const upgraded = await this.subscriptionRepository.createUserSubscription({
      user: dto.userId as any,
      plan: plan.id as any,
      startDate,
      endDate,
      status: 'active',
      amountPaid: plan.price,
      autoRenew: dto.autoRenew ?? true,
      lastPaymentId: dto.paymentId,
      metadata: { ...(dto.metadata || {}), previousSubscriptionId: current.id },
    });

    await this.subscriptionRepository.syncUserPremiumState(dto.userId, upgraded.id, upgraded.endDate);
    return upgraded;
  }
}
