import { GetSubscriptionPlansUseCase } from '../../application/use-cases/get-subscription-plans.use-case';
import { SubscribeUserUseCase } from '../../application/use-cases/subscribe-user.use-case';
import { CheckSubscriptionStatusUseCase } from '../../application/use-cases/check-subscription-status.use-case';
export declare class SubscriptionsController {
    private readonly getPlansUseCase;
    private readonly subscribeUseCase;
    private readonly checkStatusUseCase;
    constructor(getPlansUseCase: GetSubscriptionPlansUseCase, subscribeUseCase: SubscribeUserUseCase, checkStatusUseCase: CheckSubscriptionStatusUseCase);
    getPlans(): Promise<import("../../domain/entities/subscription.entity").SubscriptionPlanEntity[]>;
    subscribe(req: any, planId: string): Promise<import("../../domain/entities/subscription.entity").UserSubscriptionEntity>;
    checkStatus(req: any): Promise<{
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
    getHistory(req: any): Promise<{
        history: never[];
    }>;
}
