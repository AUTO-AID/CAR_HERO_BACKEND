/**
 * Get Vehicle Maintenance Use Case
 * Retrieves all maintenance records for a vehicle
 */
import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { IMaintenanceRecordRepository } from '../../domain/repositories/maintenance-record.repository.interface';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { MaintenanceRecordEntity } from '../../domain/entities/maintenance-record.entity';

@Injectable()
export class GetVehicleMaintenanceUseCase {
  constructor(
    @Inject(IMaintenanceRecordRepository)
    private readonly maintenanceRepository: IMaintenanceRecordRepository,
    @Inject(IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async execute(
    vehicleId: string,
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ records: MaintenanceRecordEntity[]; pagination: any }> {
    // Verify vehicle ownership
    const belongsToUser = await this.vehicleRepository.belongsToUser(vehicleId, userId);
    if (!belongsToUser) {
      throw new ForbiddenException('You do not have permission to view this vehicle records');
    }

    // Verify vehicle exists
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    const cacheKey = `maintenance_vehicle_${vehicleId}_page_${page}_limit_${limit}`;

    // Try to get from cache
    const cached = await this.cacheManager.get<{ records: MaintenanceRecordEntity[]; pagination: any }>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const skip = (page - 1) * limit;
    const { records, total } = await this.maintenanceRepository.findByVehicleId(vehicleId, skip, limit);

    const result = {
      records,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };

    // Save to cache (10 minutes)
    await this.cacheManager.set(cacheKey, result, 600000);

    return result;
  }
}
