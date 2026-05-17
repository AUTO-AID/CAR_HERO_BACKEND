import { Inject, Injectable } from '@nestjs/common';
import { ISubscriptionRepository } from '../../domain/repositories/subscription.repository.interface';

@Injectable()
export class GetSubscriptionStatsUseCase {
  constructor(
    @Inject(ISubscriptionRepository)
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  async execute() {
    await this.subscriptionRepository.expireEndedSubscriptions();
    return this.subscriptionRepository.getSubscriptionStats();
  }
}
