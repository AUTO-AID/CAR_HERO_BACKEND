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

    // NOT cached on purpose — same defect that was fixed for the vehicles list:
    // the read cached under `maintenance_vehicle_<id>_page_<n>_limit_<n>` while
    // CreateMaintenanceRecordUseCase deleted only `maintenance_vehicle_<id>`, so a
    // record the user just added stayed invisible for up to 10 minutes. The query
    // is per-vehicle and tiny, so serving it from Mongo is cheaper than any
    // correct invalidation scheme.
    const skip = (page - 1) * limit;
    const { records, total } = await this.maintenanceRepository.findByVehicleId(vehicleId, skip, limit);

    return {
      records,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
