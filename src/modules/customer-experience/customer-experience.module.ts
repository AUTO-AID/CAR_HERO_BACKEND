import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/infrastructure/persistence/mongoose/schemas/user.schema';
import { Vehicle, VehicleSchema } from '../vehicles/infrastructure/persistence/mongoose/schemas/vehicle.schema';
import { CustomerExperienceService } from './application/services/customer-experience.service';
import {
  Offer,
  OfferRedemption,
  OfferRedemptionSchema,
  OfferSchema,
  UserAddress,
  UserAddressSchema,
  UserDevice,
  UserDeviceSchema,
  UserPaymentMethod,
  UserPaymentMethodSchema,
  WashPlan,
  WashPlanSchema,
} from './infrastructure/persistence/mongoose/schemas/customer-experience.schema';
import { CustomerExperienceController } from './presentation/controllers/customer-experience.controller';
import { AdminOffersController } from './presentation/controllers/admin-offers.controller';
import { Order, OrderSchema } from '../orders/infrastructure/persistence/mongoose/schemas/order.schema';
import { Service, ServiceSchema } from '../services/infrastructure/persistence/mongoose/schemas/service.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { CustomerExperienceCronService } from './application/services/customer-experience-cron.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserAddress.name, schema: UserAddressSchema },
      { name: UserPaymentMethod.name, schema: UserPaymentMethodSchema },
      { name: Offer.name, schema: OfferSchema },
      { name: OfferRedemption.name, schema: OfferRedemptionSchema },
      { name: WashPlan.name, schema: WashPlanSchema },
      { name: UserDevice.name, schema: UserDeviceSchema },
      { name: User.name, schema: UserSchema },
      { name: Vehicle.name, schema: VehicleSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Service.name, schema: ServiceSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [CustomerExperienceController, AdminOffersController],
  providers: [CustomerExperienceService, CustomerExperienceCronService],
})
export class CustomerExperienceModule {}
