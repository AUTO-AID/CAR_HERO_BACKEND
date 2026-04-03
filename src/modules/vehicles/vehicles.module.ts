/**
 * Vehicles Module
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Vehicle, VehicleSchema } from '../../database/schemas/vehicle.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Vehicle.name, schema: VehicleSchema }]),
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class VehiclesModule {}
