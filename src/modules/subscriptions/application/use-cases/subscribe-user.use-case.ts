import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { ISubscriptionRepository } from '../../domain/repositories/subscription.repository.interface';

export interface SubscribeCommand {
  userId: string;
  planId: string;
  paymentId?: string;
  autoRenew?: boolean;
  metadata?: Record<string, any>;
}

@Injectable()
export class SubscribeUserUseCase {
  constructor(
    @Inject(ISubscriptionRepository)
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  async execute(dto: SubscribeCommand) {
    const plan = await this.subscriptionRepository.findPlanById(dto.planId);
    if (!plan || !plan.isActive) {
      throw new BadRequestException('Invalid or inactive subscription plan');
    }

    const currentSub = await this.subscriptionRepository.findUserActiveSubscription(dto.userId);
    if (currentSub) {
      throw new BadRequestException('User already has an active subscription');
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const subscription = await this.subscriptionRepository.createUserSubscription({
      user: dto.userId as any,
      plan: plan.id as any,
      startDate,
      endDate,
      status: 'active',
      amountPaid: plan.price,
      autoRenew: dto.autoRenew ?? true,
      lastPaymentId: dto.paymentId,
      metadata: dto.metadata,
    });

    await this.subscriptionRepository.syncUserPremiumState(dto.userId, subscription.id, subscription.endDate);
    return subscription;
  }
}
