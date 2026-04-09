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
    // Verify ownership
    const belongsToUser = await this.vehicleRepository.belongsToUser(vehicleId, userId);
    if (!belongsToUser) {
      throw new ForbiddenException('You do not have permission to delete this vehicle');
    }

    // Find vehicle
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
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

  /**
   * Set another vehicle as default when current default is deleted
   */
  private async setDefaultAnotherVehicle(userId: string, excludeVehicleId: string): Promise<void> {
    const { vehicles } = await this.vehicleRepository.findByUserId(userId);
    const otherVehicle = vehicles.find(v => v.id !== excludeVehicleId);
    if (otherVehicle) {
      await this.vehicleRepository.update(otherVehicle.id, { isDefault: true });
    }
  }

  /**
   * Invalidate cached data
   */
  private async invalidateUserCache(userId: string, vehicleId: string): Promise<void> {
    const keys = [
      `vehicle_${vehicleId}`,
      `vehicles_user_${userId}`,
      `vehicles_user_${userId}_default`,
    ];
    for (const key of keys) {
      await this.cacheManager.del(key);
    }
  }
}
