import { OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import { SubscriptionPlanDocument } from '../infrastructure/persistence/mongoose/schemas/subscription-plan.schema';
export declare class SubscriptionSeederService implements OnModuleInit {
    private readonly planModel;
    constructor(planModel: Model<SubscriptionPlanDocument>);
    onModuleInit(): Promise<void>;
}
