import { Model } from 'mongoose';
import { SubscriptionPlan, Subscription } from '../../database/schemas/subscription.schema';
export declare class SubscriptionsService {
    private readonly planModel;
    private readonly subscriptionModel;
    constructor(planModel: Model<SubscriptionPlan>, subscriptionModel: Model<Subscription>);
}
