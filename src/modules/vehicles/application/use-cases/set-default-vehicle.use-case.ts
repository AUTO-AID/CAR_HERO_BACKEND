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

    // Unset default for all other vehicles
    const { vehicles } = await this.vehicleRepository.findByUserId(userId);
    for (const v of vehicles) {
      if (v.isDefault && v.id !== vehicleId) {
        await this.vehicleRepository.update(v.id, { isDefault: false });
      }
    }

    // Set this vehicle as default
    const updatedVehicle = await this.vehicleRepository.update(vehicleId, { isDefault: true });

    // Invalidate cache
    await this.invalidateUserCache(userId);

    return updatedVehicle;
  }

  /**
   * Invalidate all cached vehicles for user
   */
  private async invalidateUserCache(userId: string): Promise<void> {
    const keys = [
      `vehicles_user_${userId}`,
      `vehicles_user_${userId}_default`,
    ];
    for (const key of keys) {
      await this.cacheManager.del(key);
    }
  }
}
