import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionsController } from './presentation/controllers/subscriptions.controller';

// Schemas
import { SubscriptionPlan, SubscriptionPlanSchema } from './infrastructure/persistence/mongoose/schemas/subscription-plan.schema';
import { UserSubscription, UserSubscriptionSchema } from './infrastructure/persistence/mongoose/schemas/user-subscription.schema';

// Repository
import { ISubscriptionRepository } from './domain/repositories/subscription.repository.interface';
import { MongooseSubscriptionRepository } from './infrastructure/repositories/mongoose-subscription.repository';

// Use Cases
import { GetSubscriptionPlansUseCase } from './application/use-cases/get-subscription-plans.use-case';
import { SubscribeUserUseCase } from './application/use-cases/subscribe-user.use-case';
import { CheckSubscriptionStatusUseCase } from './application/use-cases/check-subscription-status.use-case';
import { SubscriptionSeederService } from './infrastructure/persistence/mongoose/seeders/subscription-plan.seeder';

const UseCases = [
  GetSubscriptionPlansUseCase,
  SubscribeUserUseCase,
  CheckSubscriptionStatusUseCase,
];

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SubscriptionPlan.name, schema: SubscriptionPlanSchema },
      { name: UserSubscription.name, schema: UserSubscriptionSchema },
    ]),
  ],
  controllers: [SubscriptionsController],
  providers: [
    {
      provide: ISubscriptionRepository,
      useClass: MongooseSubscriptionRepository,
    },
    SubscriptionSeederService,
    ...UseCases,
  ],
  exports: [
    ISubscriptionRepository,
    ...UseCases,
    MongooseModule,
  ],
})
export class SubscriptionsModule {}
