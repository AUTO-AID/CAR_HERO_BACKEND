import { ISubscriptionRepository } from '../../domain/repositories/subscription.repository.interface';
export declare class CheckSubscriptionStatusUseCase {
    private readonly subscriptionRepository;
    constructor(subscriptionRepository: ISubscriptionRepository);
    execute(userId: string): Promise<{
        isActive: boolean;
        message: string;
        subscriptionId?: undefined;
        planId?: undefined;
        expiresAt?: undefined;
        daysLeft?: undefined;
    } | {
        isActive: boolean;
        subscriptionId: string;
        planId: string;
        expiresAt: Date;
        daysLeft: number;
        message?: undefined;
    }>;
}
