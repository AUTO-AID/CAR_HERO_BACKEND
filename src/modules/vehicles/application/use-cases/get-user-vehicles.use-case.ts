/**
 * Get User Vehicles Use Case (Admin)
 * Retrieves all vehicles for a specific user (admin operation)
 */
import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleEntity } from '../../domain/entities/vehicle.entity';

@Injectable()
export class GetUserVehiclesUseCase {
  constructor(
    @Inject(IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async execute(
    userId: string,
    page = 1,
    limit = 10,
  ): Promise<{ vehicles: VehicleEntity[]; pagination: any }> {
    const cacheKey = `admin_vehicles_user_${userId}_page_${page}_limit_${limit}`;

    // Try to get from cache
    const cached = await this.cacheManager.get<{ vehicles: VehicleEntity[]; pagination: any }>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const skip = (page - 1) * limit;
    const { vehicles, total } = await this.vehicleRepository.findByUserIdAdmin(userId, skip, limit);

    const result = {
      vehicles,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };

    // Save to cache (10 minutes)
    await this.cacheManager.set(cacheKey, result, 600000);

    return result;
  }
}
