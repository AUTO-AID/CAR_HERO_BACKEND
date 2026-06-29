/**
 * Delete Vehicle Use Case
 * Deletes a vehicle with ownership verification
 */
import { Inject, Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';

@Injectable()
export class DeleteVehicleUseCase {
  constructor(
    @Inject(IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async execute(vehicleId: string, userId: string): Promise<void> {
    // Find vehicle
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // Verify ownership
    const belongsToUser = await this.vehicleRepository.belongsToUser(vehicleId, userId);
    if (!belongsToUser) {
      throw new ForbiddenException('You do not have permission to delete this vehicle');
    }

    // Business Rule: Prevent deleting the default vehicle if it's the only one
    const vehicleCount = await this.vehicleRepository.countByUserId(userId);
    if (vehicleCount === 1 && vehicle.isDefault) {
      throw new BadRequestException('Cannot delete your only default vehicle. Please add another vehicle first.');
    }

    // If deleting the default vehicle, set another one as default
    if (vehicle.isDefault && vehicleCount > 1) {
      await this.setDefaultAnotherVehicle(userId, vehicleId);
    }

    // Delete vehicle
    const deleted = await this.vehicleRepository.delete(vehicleId);
    if (!deleted) {
      throw new NotFoundException('Failed to delete vehicle');
    }

    // Invalidate cache
    await this.invalidateUserCache(userId, vehicleId);
  }

  private async setDefaultAnotherVehicle(userId: string, excludeVehicleId: string): Promise<void> {
    const { vehicles } = await this.vehicleRepository.findByUserId(userId);
    const otherVehicle = vehicles.find(v => v.id !== excludeVehicleId);
    if (otherVehicle) {
      await this.vehicleRepository.setAsDefault(userId, otherVehicle.id);
    }
  }

  /**
   * Invalidate cached data
   */
  private async invalidateUserCache(userId: string, vehicleId: string): Promise<void> {
    await this.cacheManager.del(`vehicle_${vehicleId}`);
    await this.cacheManager.del(`vehicles_user_${userId}`);
    await this.cacheManager.del(`vehicles_user_${userId}_default`);
    
    // Clear paginated and search caches
    const store = (this.cacheManager as unknown as { store?: { keys?: () => Promise<string[]> } }).store;
    if (store && typeof store.keys === 'function') {
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
