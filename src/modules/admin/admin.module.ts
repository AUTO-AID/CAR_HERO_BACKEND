/**
 * Admin Module
 * Dashboard and administrative functions
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { Admin, AdminSchema } from './infrastructure/persistence/mongoose/schemas/admin.schema';
import { Setting, SettingSchema } from './infrastructure/persistence/mongoose/schemas/setting.schema';
import { AdminController } from './presentation/controllers/admin.controller';
import { AdminService } from './application/services/admin.service';
import { UsersModule } from '../users/users.module';
import { ProvidersModule } from '../providers/providers.module';
import { ServicesModule } from '../services/services.module';
import { OrdersModule } from '../orders/orders.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { IAdminRepository } from './domain/repositories/admin.repository.interface';
import { MongooseAdminRepository } from './infrastructure/persistence/mongoose-admin.repository';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { NotificationsModule } from '../notifications/notifications.module';

import { User, UserSchema } from '../users/infrastructure/persistence/mongoose/schemas/user.schema';
import { Provider, ProviderSchema } from '../providers/infrastructure/persistence/mongoose/schemas/provider.schema';
import { Service, ServiceSchema } from '../services/infrastructure/persistence/mongoose/schemas/service.schema';
import { Order, OrderSchema } from '../orders/infrastructure/persistence/mongoose/schemas/order.schema';
import { SubscriptionPlan, SubscriptionPlanSchema } from '../subscriptions/infrastructure/persistence/mongoose/schemas/subscription-plan.schema';
import { UserSubscription, UserSubscriptionSchema } from '../subscriptions/infrastructure/persistence/mongoose/schemas/user-subscription.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Admin.name, schema: AdminSchema },
      { name: Setting.name, schema: SettingSchema },
      { name: User.name, schema: UserSchema },
      { name: Provider.name, schema: ProviderSchema },
      { name: Service.name, schema: ServiceSchema },
      { name: Order.name, schema: OrderSchema },
      { name: SubscriptionPlan.name, schema: SubscriptionPlanSchema },
      { name: UserSubscription.name, schema: UserSubscriptionSchema },
    ]),
    JwtModule,
    UsersModule,
    ProvidersModule,
    ServicesModule,
    OrdersModule,
    SubscriptionsModule,
    NotificationsModule,
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    LoginUseCase,
    {
      provide: IAdminRepository,
      useClass: MongooseAdminRepository,
    },
  ],
  exports: [AdminService, IAdminRepository],
})
export class AdminModule {}
