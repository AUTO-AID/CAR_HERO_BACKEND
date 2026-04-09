/**
 * Get Vehicle Distribution Use Case (Admin)
 * Retrieves vehicle distribution statistics by brand
 */
import { Inject, Injectable } from '@nestjs/common';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';

@Injectable()
export class GetVehicleDistributionUseCase {
  constructor(
    @Inject(IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
  ) {}

  async execute(): Promise<{ brand: string; count: number; percentage: number }[]> {
    return this.vehicleRepository.getDistribution();
  }
}
