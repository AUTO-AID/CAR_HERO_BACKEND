import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { ISubscriptionRepository } from '../../domain/repositories/subscription.repository.interface';
import { UserSubscriptionEntity } from '../../domain/entities/subscription.entity';

export interface SubscribeDto {
  userId: string;
  planId: string;
}

@Injectable()
export class SubscribeUserUseCase {
  constructor(
    @Inject(ISubscriptionRepository)
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  async execute(dto: SubscribeDto) {
    // 1. Check if plan exists and is active
    const plan = await this.subscriptionRepository.findPlanById(dto.planId);
    if (!plan || !plan.isActive) {
      throw new BadRequestException('Invalid or inactive subscription plan');
    }

    // 2. Check if user already has an active subscription
    const currentSub = await this.subscriptionRepository.findUserActiveSubscription(dto.userId);
    if (currentSub) {
      // In a real app, you might upgrade or stack them. Here we just prevent duplicate.
      throw new BadRequestException('User already has an active subscription');
    }

    // 3. Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.durationDays);

    // 4. Create record
    return this.subscriptionRepository.createUserSubscription({
      user: dto.userId as any,
      plan: plan.id as any,
      startDate,
      endDate,
      status: 'active',
      amountPaid: plan.price,
      autoRenew: true,
    });
  }
}
