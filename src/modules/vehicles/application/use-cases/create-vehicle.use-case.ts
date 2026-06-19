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

    // Create vehicle (initially without default, we set it atomically after)
    const vehicleData: Partial<VehicleEntity> = {
      ...dto,
      userId,
      isDefault: vehicleCount === 0 ? true : false,
    };

    let vehicle = await this.vehicleRepository.create(vehicleData);

    // If it should be default and it's not the first vehicle, use atomic method
    if (isDefault && vehicleCount > 0) {
      vehicle = await this.vehicleRepository.setAsDefault(userId, vehicle.id);
    }

    // Invalidate cache
    await this.invalidateUserCache(userId);

    return vehicle;
  }

  /**
   * Invalidate all cached vehicles for user
   */
  private async invalidateUserCache(userId: string): Promise<void> {
    await this.cacheManager.del(`vehicles_user_${userId}`);
    await this.cacheManager.del(`vehicles_user_${userId}_default`);
    
    // Clear paginated and search caches
    const store = this.cacheManager.store as any;
    if (typeof store.keys === 'function') {
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
