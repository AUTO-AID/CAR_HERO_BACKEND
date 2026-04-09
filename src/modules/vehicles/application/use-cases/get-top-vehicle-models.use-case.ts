/**
 * Get Top Vehicle Models Use Case (Admin)
 * Retrieves most popular vehicle models by usage
 */
import { Inject, Injectable } from '@nestjs/common';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';

@Injectable()
export class GetTopVehicleModelsUseCase {
  constructor(
    @Inject(IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
  ) {}

  async execute(limit = 10): Promise<{ brand: string; model: string; count: number }[]> {
    return this.vehicleRepository.getTopModels(limit);
  }
}
