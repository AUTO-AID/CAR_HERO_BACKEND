/**
 * Admin Module
 * Dashboard and administrative functions
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { Admin, AdminSchema } from '../../database/schemas/admin.schema';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admin.service';
import { UsersModule } from '../users/users.module';
import { ProvidersModule } from '../providers/providers.module';
import { ServicesModule } from '../services/services.module';
import { BookingsModule } from '../bookings/bookings.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Admin.name, schema: AdminSchema }]),
    JwtModule,
    UsersModule,
    ProvidersModule,
    ServicesModule,
    BookingsModule,
    OrdersModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
