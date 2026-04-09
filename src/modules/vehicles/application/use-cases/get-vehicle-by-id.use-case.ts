/**
 * Get Vehicle By ID Use Case
 * Retrieves a specific vehicle by ID with ownership verification
 */
import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleEntity } from '../../domain/entities/vehicle.entity';

@Injectable()
export class GetVehicleByIdUseCase {
  constructor(
    @Inject(IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async execute(vehicleId: string, userId: string): Promise<VehicleEntity> {
    const cacheKey = `vehicle_${vehicleId}`;

    // Try to get from cache
    const cached = await this.cacheManager.get<VehicleEntity>(cacheKey);
    let vehicle: VehicleEntity | null;

    if (cached) {
      vehicle = cached;
    } else {
      // Fetch from database
      vehicle = await this.vehicleRepository.findById(vehicleId);
      if (!vehicle) {
        throw new NotFoundException('Vehicle not found');
      }
      // Save to cache (10 minutes)
      await this.cacheManager.set(cacheKey, vehicle, 600000);
    }

    // Ownership Verification
    if (vehicle.userId.toString() !== userId.toString()) {
      throw new ForbiddenException('You do not have permission to access this vehicle');
    }

    return vehicle;
  }
}
