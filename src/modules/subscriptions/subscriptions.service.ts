import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SubscriptionPlan,
  Subscription,
} from '../../database/schemas/subscription.schema';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(SubscriptionPlan.name) private readonly planModel: Model<SubscriptionPlan>,
    @InjectModel(Subscription.name) private readonly subscriptionModel: Model<Subscription>,
  ) {}
}
