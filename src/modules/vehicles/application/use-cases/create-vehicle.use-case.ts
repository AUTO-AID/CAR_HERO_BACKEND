/**
 * Create Vehicle Use Case
 * Creates a new vehicle for the authenticated user
 */
import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleEntity } from '../../domain/entities/vehicle.entity';
import { CreateVehicleDto } from '../dto/create-vehicle.dto';

@Injectable()
export class CreateVehicleUseCase {
  constructor(
    @Inject(IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async execute(dto: CreateVehicleDto, userId: string): Promise<VehicleEntity> {
    // Validate year
    const currentYear = new Date().getFullYear();
    if (dto.year < 1900 || dto.year > currentYear + 1) {
      throw new BadRequestException(`Invalid year. Must be between 1900 and ${currentYear + 1}`);
    }

    // Validate VIN format if provided
    if (dto.vin && dto.vin.length !== 17) {
      throw new BadRequestException('VIN must be exactly 17 characters');
    }

    // Check if user has reached vehicle limit (optional business rule)
    const vehicleCount = await this.vehicleRepository.countByUserId(userId);
    if (vehicleCount >= 10) {
      throw new BadRequestException('Maximum number of vehicles reached (10). Please remove a vehicle first.');
    }

    // If this is the first vehicle, make it default automatically
    const isDefault = vehicleCount === 0 ? true : (dto.isDefault ?? false);

    // If setting as default, unset other defaults first
    if (isDefault) {
      await this.unsetOtherDefaults(userId);
    }

    // Create vehicle
    const vehicleData: Partial<VehicleEntity> = {
      ...dto,
      userId,
      isDefault,
    };

    const vehicle = await this.vehicleRepository.create(vehicleData);

    // Invalidate cache
    await this.invalidateUserCache(userId);

    return vehicle;
  }

  /**
   * Unset default status for all user's vehicles
   */
  private async unsetOtherDefaults(userId: string): Promise<void> {
    const { vehicles } = await this.vehicleRepository.findByUserId(userId);
    for (const v of vehicles) {
      if (v.isDefault) {
        await this.vehicleRepository.update(v.id, { isDefault: false });
      }
    }
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
