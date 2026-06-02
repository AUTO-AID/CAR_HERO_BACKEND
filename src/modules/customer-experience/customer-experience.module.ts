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
    ]),
  ],
  controllers: [CustomerExperienceController, AdminOffersController],
  providers: [CustomerExperienceService],
})
export class CustomerExperienceModule {}
