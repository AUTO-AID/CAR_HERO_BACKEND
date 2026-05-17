import { Inject, Injectable } from '@nestjs/common';
import { ISubscriptionRepository } from '../../domain/repositories/subscription.repository.interface';
import { ListSubscriptionsQueryDto } from '../dto/list-subscriptions-query.dto';

@Injectable()
export class ListSubscriptionsUseCase {
  constructor(
    @Inject(ISubscriptionRepository)
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  async execute(query: ListSubscriptionsQueryDto) {
    await this.subscriptionRepository.expireEndedSubscriptions();
    return this.subscriptionRepository.findSubscriptions(query);
  }
}
