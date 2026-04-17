/**
 * Vehicles Module Test
 * Verify vehicles module structure
 */
import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { Vehicle, VehicleSchema } from '../../modules/vehicles/infrastructure/persistence/mongoose/schemas/vehicle.schema';
import { IVehicleRepository } from './domain/repositories/vehicle.repository.interface';
import { MongooseVehicleRepository } from './infrastructure/persistence/mongoose-vehicle.repository';
import { CreateVehicleUseCase } from './application/use-cases/create-vehicle.use-case';
import { VehiclesController } from './presentation/controllers/vehicles.controller';

describe('VehiclesModule', () => {
  it('should compile', () => {
    expect(IVehicleRepository).toBeDefined();
    expect(MongooseVehicleRepository).toBeDefined();
    expect(CreateVehicleUseCase).toBeDefined();
    expect(VehiclesController).toBeDefined();
  });
});
