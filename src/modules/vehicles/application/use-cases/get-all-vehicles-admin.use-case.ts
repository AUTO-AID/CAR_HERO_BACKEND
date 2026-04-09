/**
 * Get All Vehicles Use Case (Admin)
 * Retrieves all vehicles in the system with pagination
 */
import { Inject, Injectable } from '@nestjs/common';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleEntity } from '../../domain/entities/vehicle.entity';

@Injectable()
export class GetAllVehiclesAdminUseCase {
  constructor(
    @Inject(IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
  ) {}

  async execute(
    page = 1,
    limit = 20,
  ): Promise<{ vehicles: VehicleEntity[]; pagination: any }> {
    const skip = (page - 1) * limit;
    const { vehicles, total } = await this.vehicleRepository.findAll(skip, limit);

    return {
      vehicles,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
