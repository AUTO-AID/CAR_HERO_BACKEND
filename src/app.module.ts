/**
 * App Module
 * Root module for Car Hero Backend
 */
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

// Configuration
import envConfig from './config/env.config';
import { mongoConfig } from './config/mongo.config';

// Common
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

// Feature Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { ServicesModule } from './modules/services/services.module';
import { OrdersModule } from './modules/orders/orders.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { ChatModule } from './modules/chat/chat.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { AiModule } from './modules/ai/ai.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { ProfileModule } from './modules/profile/profile.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
      envFilePath: ['.env', '.env.local'],
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([{ 
      ttl: 60000, 
      limit: 20 
    }]),

    // Database
    MongooseModule.forRootAsync(mongoConfig),

    // WhatsApp
    WhatsAppModule,

    // Feature Modules
    AuthModule,
    UsersModule,
    ProvidersModule,
    VehiclesModule,
    ServicesModule,
    OrdersModule,
    BookingsModule,
    ChatModule,
    WalletModule,
    SubscriptionsModule,
    ReviewsModule,
    NotificationsModule,
    AdminModule,
    AiModule,
    GatewayModule,
    ProfileModule,
  ],
  providers: [
    // Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },

    // Global Validation Pipe
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    },

    // Global Transform Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },

    // Global Logging Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },

    // Global JWT Auth Guard
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
