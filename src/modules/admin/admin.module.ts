/**
 * Admin Module
 * Dashboard and administrative functions
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { Admin, AdminSchema } from '../../database/schemas/admin.schema';
import { Setting, SettingSchema } from '../../database/schemas/setting.schema';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admin.service';
import { UsersModule } from '../users/users.module';
import { ProvidersModule } from '../providers/providers.module';
import { ServicesModule } from '../services/services.module';
import { BookingsModule } from '../bookings/bookings.module';
import { OrdersModule } from '../orders/orders.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { IAdminRepository } from './domain/repositories/admin.repository.interface';
import { MongooseAdminRepository } from './infrastructure/persistence/mongoose-admin.repository';
import { LoginUseCase } from './application/use-cases/login.use-case';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Admin.name, schema: AdminSchema },
      { name: Setting.name, schema: SettingSchema },
    ]),
    JwtModule,
    UsersModule,
    ProvidersModule,
    ServicesModule,
    BookingsModule,
    OrdersModule,
    SubscriptionsModule,
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
