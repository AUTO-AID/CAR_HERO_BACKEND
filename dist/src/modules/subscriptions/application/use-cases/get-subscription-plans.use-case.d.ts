import { ISubscriptionRepository } from '../../domain/repositories/subscription.repository.interface';
export declare class GetSubscriptionPlansUseCase {
    private readonly subscriptionRepository;
    constructor(subscriptionRepository: ISubscriptionRepository);
    execute(activeOnly?: boolean): Promise<import("../../domain/entities/subscription.entity").SubscriptionPlanEntity[]>;
}
