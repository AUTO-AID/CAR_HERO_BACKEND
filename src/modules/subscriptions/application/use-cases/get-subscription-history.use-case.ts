import { Inject, Injectable } from '@nestjs/common';
import { ISubscriptionRepository } from '../../domain/repositories/subscription.repository.interface';

@Injectable()
export class GetSubscriptionHistoryUseCase {
  constructor(
    @Inject(ISubscriptionRepository)
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  async execute(userId: string) {
    return this.subscriptionRepository.findUserSubscriptionHistory(userId);
  }
}
