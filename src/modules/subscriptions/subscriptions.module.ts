import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionsController } from './presentation/controllers/subscriptions.controller';

// Schemas
import { SubscriptionPlan, SubscriptionPlanSchema } from './infrastructure/persistence/mongoose/schemas/subscription-plan.schema';
import { UserSubscription, UserSubscriptionSchema } from './infrastructure/persistence/mongoose/schemas/user-subscription.schema';
import { User, UserSchema } from '../users/infrastructure/persistence/mongoose/schemas/user.schema';

// Repository
import { ISubscriptionRepository } from './domain/repositories/subscription.repository.interface';
import { MongooseSubscriptionRepository } from './infrastructure/repositories/mongoose-subscription.repository';

// Use Cases
import { GetSubscriptionPlansUseCase } from './application/use-cases/get-subscription-plans.use-case';
import { SubscribeUserUseCase } from './application/use-cases/subscribe-user.use-case';
import { CheckSubscriptionStatusUseCase } from './application/use-cases/check-subscription-status.use-case';
import { CancelSubscriptionUseCase } from './application/use-cases/cancel-subscription.use-case';
import { RenewSubscriptionUseCase } from './application/use-cases/renew-subscription.use-case';
import { UpgradeSubscriptionUseCase } from './application/use-cases/upgrade-subscription.use-case';
import { GetSubscriptionHistoryUseCase } from './application/use-cases/get-subscription-history.use-case';
import { ManageSubscriptionPlansUseCase } from './application/use-cases/manage-subscription-plans.use-case';
import { ListSubscriptionsUseCase } from './application/use-cases/list-subscriptions.use-case';
import { GetSubscriptionStatsUseCase } from './application/use-cases/get-subscription-stats.use-case';
import { SubscriptionSeederService } from './infrastructure/persistence/mongoose/seeders/subscription-plan.seeder';

import { WalletModule } from '../wallet/wallet.module';

const UseCases = [
  GetSubscriptionPlansUseCase,
  SubscribeUserUseCase,
  CheckSubscriptionStatusUseCase,
  CancelSubscriptionUseCase,
  RenewSubscriptionUseCase,
  UpgradeSubscriptionUseCase,
  GetSubscriptionHistoryUseCase,
  ManageSubscriptionPlansUseCase,
  ListSubscriptionsUseCase,
  GetSubscriptionStatsUseCase,
];

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SubscriptionPlan.name, schema: SubscriptionPlanSchema },
      { name: UserSubscription.name, schema: UserSubscriptionSchema },
      { name: User.name, schema: UserSchema },
    ]),
    WalletModule,
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
