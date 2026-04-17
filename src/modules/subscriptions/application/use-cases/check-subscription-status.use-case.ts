import { Inject, Injectable } from '@nestjs/common';
import { ISubscriptionRepository } from '../../domain/repositories/subscription.repository.interface';

@Injectable()
export class CheckSubscriptionStatusUseCase {
  constructor(
    @Inject(ISubscriptionRepository)
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  async execute(userId: string) {
    const subscription = await this.subscriptionRepository.findUserActiveSubscription(userId);
    
    if (!subscription) {
      return { isActive: false, message: 'No active subscription found' };
    }

    return {
      isActive: true,
      subscriptionId: subscription.id,
      planId: subscription.planId,
      expiresAt: subscription.endDate,
      daysLeft: Math.max(0, Math.ceil((subscription.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))),
    };
  }
}
