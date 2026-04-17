/**
 * Notifications Module
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsController } from './presentation/controllers/notifications.controller';
import { NotificationsService } from './application/services/notifications.service';
import { NotificationsGateway } from './presentation/gateways/notifications.gateway';
import { Notification, NotificationSchema } from './infrastructure/persistence/mongoose/schemas/notification.schema';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
    BookingsModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway],
  exports: [NotificationsService],
})
export class NotificationsModule {}
