import { SubscriptionPlanEntity, UserSubscriptionEntity } from '../entities/subscription.entity';
export interface ISubscriptionRepository {
    findAllPlans(activeOnly?: boolean): Promise<SubscriptionPlanEntity[]>;
    findPlanById(id: string): Promise<SubscriptionPlanEntity | null>;
    createPlan(plan: Partial<SubscriptionPlanEntity>): Promise<SubscriptionPlanEntity>;
    updatePlan(id: string, plan: Partial<SubscriptionPlanEntity>): Promise<SubscriptionPlanEntity>;
    deletePlan(id: string): Promise<boolean>;
    findUserActiveSubscription(userId: string): Promise<UserSubscriptionEntity | null>;
    createUserSubscription(data: Partial<UserSubscriptionEntity>): Promise<UserSubscriptionEntity>;
    updateUserSubscription(id: string, data: Partial<UserSubscriptionEntity>): Promise<UserSubscriptionEntity>;
    findUserSubscriptionHistory(userId: string): Promise<UserSubscriptionEntity[]>;
    countActiveSubscriptions(): Promise<number>;
}
export declare const ISubscriptionRepository: unique symbol;
