/**
 * Get Vehicle Year Statistics Use Case (Admin)
 * Retrieves vehicle distribution by manufacturing year
 */
import { Inject, Injectable } from '@nestjs/common';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';

@Injectable()
export class GetVehicleYearStatsUseCase {
  constructor(
    @Inject(IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
  ) {}

  async execute(): Promise<{ year: number; count: number }[]> {
    return this.vehicleRepository.getStatsByYear();
  }
}
