import { Model } from 'mongoose';
import { ISubscriptionRepository } from '../../domain/repositories/subscription.repository.interface';
import { SubscriptionPlanEntity, UserSubscriptionEntity } from '../../domain/entities/subscription.entity';
import { SubscriptionPlanDocument } from '../persistence/mongoose/schemas/subscription-plan.schema';
import { UserSubscriptionDocument } from '../persistence/mongoose/schemas/user-subscription.schema';
export declare class MongooseSubscriptionRepository implements ISubscriptionRepository {
    private readonly planModel;
    private readonly userSubModel;
    constructor(planModel: Model<SubscriptionPlanDocument>, userSubModel: Model<UserSubscriptionDocument>);
    private mapPlanToEntity;
    private mapUserSubToEntity;
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
