/**
 * Get Vehicle Details Use Case (Admin)
 * Retrieves complete vehicle details by ID (admin access)
 */
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleEntity } from '../../domain/entities/vehicle.entity';

@Injectable()
export class GetVehicleDetailsAdminUseCase {
  constructor(
    @Inject(IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
  ) {}

  async execute(vehicleId: string): Promise<VehicleEntity> {
    const vehicle = await this.vehicleRepository.findById(vehicleId);

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return vehicle;
  }
}
