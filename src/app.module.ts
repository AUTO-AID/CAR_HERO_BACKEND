/**
 * App Module
 * Root module for Car Hero Backend
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';

// Core
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreModule } from './core/core.module';
import envConfig from './config/env.config';
import { mongoConfig } from './config/mongo.config';
import { Setting, SettingSchema } from './modules/admin/infrastructure/persistence/mongoose/schemas/setting.schema';

// Feature Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { ServicesModule } from './modules/services/services.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ChatModule } from './modules/chat/chat.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { AiRecommendationModule } from './modules/ai-recommendation/ai-recommendation.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { ProfileModule } from './modules/profile/profile.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { AuditModule } from './modules/audit/audit.module';
import { CustomerExperienceModule } from './modules/customer-experience/customer-experience.module';
import { PaymentsModule } from './modules/payments/payments.module';

@Module({
  imports: [
    // Global Core Logic
    CoreModule,

    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
      envFilePath: ['.env', '.env.local'],
    }),

    // Infrastructure & Services
    CacheModule.register({ isGlobal: true, ttl: 60000 }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }]),
    MongooseModule.forRootAsync(mongoConfig),
    MongooseModule.forFeature([{ name: Setting.name, schema: SettingSchema }]),

    // Third Party
    WhatsAppModule,

    // Domain Modules
    AuthModule,
    UsersModule,
    ProvidersModule,
    VehiclesModule,
    ServicesModule,
    OrdersModule,
    ChatModule,
    WalletModule,
    SubscriptionsModule,
    ReviewsModule,
    NotificationsModule,
    AuditModule,
    AdminModule,
    AiRecommendationModule,
    GatewayModule,
    ProfileModule,
    CustomerExperienceModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
