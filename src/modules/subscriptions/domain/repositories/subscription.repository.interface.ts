import { SubscriptionPlanEntity, UserSubscriptionEntity } from '../entities/subscription.entity';

export interface ISubscriptionRepository {
  // Plans
  findAllPlans(activeOnly?: boolean): Promise<SubscriptionPlanEntity[]>;
  findPlanById(id: string): Promise<SubscriptionPlanEntity | null>;
  createPlan(plan: Partial<SubscriptionPlanEntity>): Promise<SubscriptionPlanEntity>;
  updatePlan(id: string, plan: Partial<SubscriptionPlanEntity>): Promise<SubscriptionPlanEntity>;
  deletePlan(id: string): Promise<boolean>;

  // User Subscriptions
  findUserSubscriptionById(id: string): Promise<UserSubscriptionEntity | null>;
  findUserActiveSubscription(userId: string): Promise<UserSubscriptionEntity | null>;
  createUserSubscription(data: Partial<UserSubscriptionEntity> & { user?: any; plan?: any }): Promise<UserSubscriptionEntity>;
  updateUserSubscription(id: string, data: Partial<UserSubscriptionEntity>): Promise<UserSubscriptionEntity>;
  findUserSubscriptionHistory(userId: string): Promise<UserSubscriptionEntity[]>;
  findSubscriptions(criteria: {
    page?: number;
    limit?: number;
    status?: string;
    userId?: string;
    planId?: string;
  }): Promise<{
    subscriptions: UserSubscriptionEntity[];
    pagination: { total: number; page: number; limit: number; pages: number };
  }>;
  expireEndedSubscriptions(now?: Date): Promise<number>;
  syncUserPremiumState(userId: string, subscriptionId?: string | null, premiumExpiresAt?: Date | null): Promise<void>;
  
  // Stats
  countActiveSubscriptions(): Promise<number>;
  getSubscriptionStats(): Promise<{
    active: number;
    expired: number;
    cancelled: number;
    pending: number;
    revenue: number;
  }>;
}

export const ISubscriptionRepository = Symbol('ISubscriptionRepository');
