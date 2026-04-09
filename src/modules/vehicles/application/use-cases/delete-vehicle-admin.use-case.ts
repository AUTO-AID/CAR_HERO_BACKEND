/**
 * Delete Vehicle Use Case (Admin)
 * Deletes any vehicle in the system (admin access)
 */
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';

@Injectable()
export class DeleteVehicleAdminUseCase {
  constructor(
    @Inject(IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
  ) {}

  async execute(vehicleId: string): Promise<void> {
    const vehicle = await this.vehicleRepository.findById(vehicleId);

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    const deleted = await this.vehicleRepository.delete(vehicleId);

    if (!deleted) {
      throw new NotFoundException('Failed to delete vehicle');
    }
  }
}
