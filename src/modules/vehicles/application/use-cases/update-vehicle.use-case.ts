/**
 * Update Vehicle Use Case
 * Updates vehicle details with ownership verification
 */
import { Inject, Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleEntity } from '../../domain/entities/vehicle.entity';
import { UpdateVehicleDto } from '../dto/update-vehicle.dto';

@Injectable()
export class UpdateVehicleUseCase {
  constructor(
    @Inject(IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async execute(vehicleId: string, dto: UpdateVehicleDto, userId: string): Promise<VehicleEntity> {
    // Find vehicle
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // Verify ownership
    const belongsToUser = await this.vehicleRepository.belongsToUser(vehicleId, userId);
    if (!belongsToUser) {
      throw new ForbiddenException('You do not have permission to update this vehicle');
    }

    // Validate year if provided
    if (dto.year !== undefined) {
      const currentYear = new Date().getFullYear();
      if (dto.year < 1900 || dto.year > currentYear + 1) {
        throw new BadRequestException(`Invalid year. Must be between 1900 and ${currentYear + 1}`);
      }
    }

    // Validate VIN if provided
    if (dto.vin !== undefined && dto.vin && dto.vin.length !== 17) {
      throw new BadRequestException('VIN must be exactly 17 characters');
    }

    // If setting as default, unset other defaults
    if (dto.isDefault === true) {
      await this.unsetOtherDefaults(userId, vehicleId);
    }

    // Update vehicle
    const updateData: Partial<VehicleEntity> = { ...dto };
    const updatedVehicle = await this.vehicleRepository.update(vehicleId, updateData);

    // Invalidate cache
    await this.invalidateUserCache(userId, vehicleId);

    return updatedVehicle;
  }

  /**
   * Unset default status for other user's vehicles (excluding current one)
   */
  private async unsetOtherDefaults(userId: string, excludeVehicleId: string): Promise<void> {
    const { vehicles } = await this.vehicleRepository.findByUserId(userId);
    for (const v of vehicles) {
      if (v.isDefault && v.id !== excludeVehicleId) {
        await this.vehicleRepository.update(v.id, { isDefault: false });
      }
    }
  }

  /**
   * Invalidate cached data for user and specific vehicle
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
