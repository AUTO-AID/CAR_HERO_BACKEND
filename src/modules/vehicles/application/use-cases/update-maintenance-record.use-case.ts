/**
 * Update Maintenance Record Use Case
 * Updates a maintenance record with ownership verification
 */
import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { IMaintenanceRecordRepository } from '../../domain/repositories/maintenance-record.repository.interface';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { MaintenanceRecordEntity } from '../../domain/entities/maintenance-record.entity';
import { UpdateMaintenanceRecordDto } from '../dto/update-maintenance-record.dto';

@Injectable()
export class UpdateMaintenanceRecordUseCase {
  constructor(
    @Inject(IMaintenanceRecordRepository)
    private readonly maintenanceRepository: IMaintenanceRecordRepository,
    @Inject(IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async execute(
    recordId: string,
    dto: UpdateMaintenanceRecordDto,
    userId: string,
  ): Promise<MaintenanceRecordEntity> {
    // Find record
    const record = await this.maintenanceRepository.findById(recordId);
    if (!record) {
      throw new NotFoundException('Maintenance record not found');
    }

    // Verify vehicle ownership
    const belongsToUser = await this.vehicleRepository.belongsToUser(record.vehicleId, userId);
    if (!belongsToUser) {
      throw new ForbiddenException('You do not have permission to update this record');
    }

    // Update record
    const updateData: Partial<MaintenanceRecordEntity> = {
      ...dto,
      date: dto.date ? new Date(dto.date) : undefined,
    };

    const updatedRecord = await this.maintenanceRepository.update(recordId, updateData);

    // Invalidate cache
    await this.invalidateVehicleCache(record.vehicleId);

    return updatedRecord;
  }

  private async invalidateVehicleCache(vehicleId: string): Promise<void> {
    try {
      let keys: string[] = [];
      const store = (this.cacheManager as any)?.store;
      const stores = (this.cacheManager as any)?.stores;
      
      if (store && typeof store.keys === 'function') {
        keys = await store.keys();
      } else if (stores && stores.length > 0 && typeof stores[0].keys === 'function') {
        keys = await stores[0].keys();
      }

      if (keys && keys.length > 0) {
        for (const key of keys) {
          if (key.startsWith(`maintenance_vehicle_${vehicleId}`)) {
            await this.cacheManager.del(key);
          }
        }
      }
    } catch (error) {
      console.warn(`[Cache Warning] Failed to invalidate cache for vehicle ${vehicleId}:`, error.message);
    }
  }
}
