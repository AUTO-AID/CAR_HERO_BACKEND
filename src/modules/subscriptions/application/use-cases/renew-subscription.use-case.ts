import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ISubscriptionRepository } from '../../domain/repositories/subscription.repository.interface';

export interface RenewSubscriptionCommand {
  userId: string;
  paymentId?: string;
  autoRenew?: boolean;
}

@Injectable()
export class RenewSubscriptionUseCase {
  constructor(
    @Inject(ISubscriptionRepository)
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  async execute(dto: RenewSubscriptionCommand) {
    const subscription = await this.subscriptionRepository.findUserActiveSubscription(dto.userId);
    if (!subscription) {
      throw new BadRequestException('No active subscription found');
    }

    const plan = await this.subscriptionRepository.findPlanById(subscription.planId);
    if (!plan || !plan.isActive) {
      throw new BadRequestException('Subscription plan is not available for renewal');
    }

    const endDate = new Date(subscription.endDate > new Date() ? subscription.endDate : new Date());
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const updated = await this.subscriptionRepository.updateUserSubscription(subscription.id, {
      endDate,
      status: 'active',
      amountPaid: subscription.amountPaid + plan.price,
      autoRenew: dto.autoRenew ?? subscription.autoRenew,
      lastPaymentId: dto.paymentId,
    });

    await this.subscriptionRepository.syncUserPremiumState(dto.userId, updated.id, updated.endDate);
    return updated;
  }
}
