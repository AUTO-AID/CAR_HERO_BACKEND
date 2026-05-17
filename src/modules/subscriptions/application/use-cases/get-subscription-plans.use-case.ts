import { Inject, Injectable } from '@nestjs/common';
import { ISubscriptionRepository } from '../../domain/repositories/subscription.repository.interface';

@Injectable()
export class GetSubscriptionPlansUseCase {
  constructor(
    @Inject(ISubscriptionRepository)
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  async execute(activeOnly: boolean = true) {
    return this.subscriptionRepository.findAllPlans(activeOnly);
  }

  async findById(id: string) {
    return this.subscriptionRepository.findPlanById(id);
  }
}
