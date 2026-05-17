import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ISubscriptionRepository } from '../../domain/repositories/subscription.repository.interface';
import { CreateSubscriptionPlanDto } from '../dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from '../dto/update-subscription-plan.dto';

@Injectable()
export class ManageSubscriptionPlansUseCase {
  constructor(
    @Inject(ISubscriptionRepository)
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  async create(dto: CreateSubscriptionPlanDto) {
    return this.subscriptionRepository.createPlan({
      ...dto,
      features: dto.features || [],
      featuresAr: dto.featuresAr || [],
      isActive: dto.isActive ?? true,
      tier: dto.tier || 'basic',
      sortOrder: dto.sortOrder || 0,
    });
  }

  async update(id: string, dto: UpdateSubscriptionPlanDto) {
    const plan = await this.subscriptionRepository.findPlanById(id);
    if (!plan) throw new NotFoundException('Subscription plan not found');
    return this.subscriptionRepository.updatePlan(id, dto);
  }

  async delete(id: string) {
    const activeSubscriptions = await this.subscriptionRepository.findSubscriptions({
      planId: id,
      status: 'active',
      page: 1,
      limit: 1,
    });
    if (activeSubscriptions.pagination.total > 0) {
      throw new BadRequestException('Cannot delete a plan with active subscriptions. Deactivate it instead.');
    }

    const deleted = await this.subscriptionRepository.deletePlan(id);
    if (!deleted) throw new NotFoundException('Subscription plan not found');
    return { message: 'Subscription plan deleted successfully' };
  }
}
