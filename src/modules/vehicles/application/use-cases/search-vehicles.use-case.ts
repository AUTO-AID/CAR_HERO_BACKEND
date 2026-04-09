/**
 * Search Vehicles Use Case
 * Searches vehicles by brand, model, plateNumber, etc. for the authenticated user
 */
import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleEntity } from '../../domain/entities/vehicle.entity';

@Injectable()
export class SearchVehiclesUseCase {
  constructor(
    @Inject(IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async execute(
    userId: string,
    query: string,
    page = 1,
    limit = 10,
  ): Promise<{ vehicles: VehicleEntity[]; pagination: any }> {
    // Validate search query
    if (!query || query.trim().length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters');
    }

    const cacheKey = `vehicles_search_user_${userId}_q_${query}_page_${page}_limit_${limit}`;

    // Try to get from cache
    const cached = await this.cacheManager.get<{ vehicles: VehicleEntity[]; pagination: any }>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const skip = (page - 1) * limit;
    const { vehicles, total } = await this.vehicleRepository.search(query, userId, skip, limit);

    const result = {
      vehicles,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };

    // Save to cache (5 minutes)
    await this.cacheManager.set(cacheKey, result, 300000);

    return result;
  }
}
