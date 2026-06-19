/**
 * Set Default Vehicle Use Case
 * Sets a specific vehicle as the user's default vehicle
 */
import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleEntity } from '../../domain/entities/vehicle.entity';

@Injectable()
export class SetDefaultVehicleUseCase {
  constructor(
    @Inject(IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async execute(vehicleId: string, userId: string): Promise<VehicleEntity> {
    // Verify ownership
    const belongsToUser = await this.vehicleRepository.belongsToUser(vehicleId, userId);
    if (!belongsToUser) {
      throw new ForbiddenException('You do not have permission to modify this vehicle');
    }

    // Find vehicle
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // Check if already default
    if (vehicle.isDefault) {
      return vehicle; // Already default, no action needed
    }

    // Set this vehicle as default (Uses atomic transaction in repository)
    const updatedVehicle = await this.vehicleRepository.setAsDefault(userId, vehicleId);

    // Invalidate cache
    await this.invalidateUserCache(userId);

    return updatedVehicle;
  }

  /**
   * Invalidate all cached vehicles for user
   */
  private async invalidateUserCache(userId: string): Promise<void> {
    await this.cacheManager.del(`vehicles_user_${userId}`);
    await this.cacheManager.del(`vehicles_user_${userId}_default`);
    
    // Clear paginated and search caches
    const store = (this.cacheManager as any).store;
    if (typeof store?.keys === 'function') {
      try {
        const allKeys = await store.keys();
        const keysToDelete = allKeys.filter(k => 
          k.includes(`vehicles_user_${userId}`) || 
          k.includes(`vehicles_search_user_${userId}`)
        );
        for (const key of keysToDelete) {
          await this.cacheManager.del(key);
        }
      } catch (e) {
        // Ignore errors if store doesn't support keys()
      }
    }
  }
}
