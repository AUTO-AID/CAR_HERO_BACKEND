import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ISubscriptionRepository } from '../../domain/repositories/subscription.repository.interface';

export interface CancelSubscriptionCommand {
  userId: string;
  reason?: string;
  cancelImmediately?: boolean;
}

@Injectable()
export class CancelSubscriptionUseCase {
  constructor(
    @Inject(ISubscriptionRepository)
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  async execute(dto: CancelSubscriptionCommand) {
    const subscription = await this.subscriptionRepository.findUserActiveSubscription(dto.userId);
    if (!subscription) {
      throw new BadRequestException('No active subscription found');
    }

    const updates: any = {
      autoRenew: false,
      metadata: {
        ...(subscription.metadata || {}),
        cancellationReason: dto.reason,
      },
    };

    if (dto.cancelImmediately) {
      updates.status = 'cancelled';
      updates.cancelledAt = new Date();
      updates.endDate = new Date();
    }

    const updated = await this.subscriptionRepository.updateUserSubscription(subscription.id, updates);
    if (dto.cancelImmediately) {
      await this.subscriptionRepository.syncUserPremiumState(dto.userId, null, null);
    }

    return {
      message: dto.cancelImmediately
        ? 'Subscription cancelled successfully'
        : 'Subscription auto-renew disabled successfully',
      subscription: updated,
    };
  }
}
