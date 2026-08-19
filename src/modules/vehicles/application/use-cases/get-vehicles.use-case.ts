/**
 * Get Vehicles Use Case
 * Retrieves all vehicles for the authenticated user
 */
import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleEntity } from '../../domain/entities/vehicle.entity';

@Injectable()
export class GetVehiclesUseCase {
  constructor(
    @Inject(IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /**
   * NOT cached on purpose.
   *
   * This response used to be cached for 10 minutes under
   * `vehicles_user_<id>_page_<n>_limit_<n>`, and the mutation use-cases tried to
   * invalidate it by enumerating cache keys via `store.keys()`. cache-manager v7
   * backs the cache with Keyv, which exposes `iterator` and **no `keys()`**, so the
   * sweep silently did nothing (it sits inside a try/catch) and the paginated key
   * was never deleted. Result: a vehicle the user just added stayed invisible in
   * "مركباتي" for up to 10 minutes.
   *
   * The query is per-user and tiny (max 10 vehicles), so serving it straight from
   * Mongo is cheaper than any correct invalidation scheme would be.
   */
  async execute(userId: string, page = 1, limit = 10): Promise<{ vehicles: VehicleEntity[]; pagination: any }> {
    const skip = (page - 1) * limit;
    const { vehicles, total } = await this.vehicleRepository.findByUserId(userId, skip, limit);

    const result = {
      vehicles,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };

    return result;
  }
}
