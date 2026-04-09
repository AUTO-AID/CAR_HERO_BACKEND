/**
 * Get Vehicle Statistics Use Case (Admin)
 * Retrieves vehicle statistics by brand
 */
import { Inject, Injectable } from '@nestjs/common';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';

@Injectable()
export class GetVehicleStatsUseCase {
  constructor(
    @Inject(IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
  ) {}

  async execute(): Promise<{ stats: { brand: string; count: number }[]; total: number }> {
    const stats = await this.vehicleRepository.getStatsByBrand();
    const total = stats.reduce((sum, item) => sum + item.count, 0);

    return { stats, total };
  }
}
