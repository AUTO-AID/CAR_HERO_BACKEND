import { ISubscriptionRepository } from '../../domain/repositories/subscription.repository.interface';
import { UserSubscriptionEntity } from '../../domain/entities/subscription.entity';
export interface SubscribeDto {
    userId: string;
    planId: string;
}
export declare class SubscribeUserUseCase {
    private readonly subscriptionRepository;
    constructor(subscriptionRepository: ISubscriptionRepository);
    execute(dto: SubscribeDto): Promise<UserSubscriptionEntity>;
}
