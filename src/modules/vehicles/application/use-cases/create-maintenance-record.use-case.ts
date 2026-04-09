/**
 * Create Maintenance Record Use Case
 * Creates a new maintenance record for a vehicle
 */
import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { IMaintenanceRecordRepository } from '../../domain/repositories/maintenance-record.repository.interface';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { MaintenanceRecordEntity } from '../../domain/entities/maintenance-record.entity';
import { CreateMaintenanceRecordDto } from '../dto/create-maintenance-record.dto';

@Injectable()
export class CreateMaintenanceRecordUseCase {
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
    dto: CreateMaintenanceRecordDto,
    userId: string,
  ): Promise<MaintenanceRecordEntity> {
    // Verify vehicle ownership
    const belongsToUser = await this.vehicleRepository.belongsToUser(vehicleId, userId);
    if (!belongsToUser) {
      throw new ForbiddenException('You do not have permission to add records to this vehicle');
    }

    // Verify vehicle exists
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // Create record
    const recordData: Partial<MaintenanceRecordEntity> = {
      ...dto,
      vehicleId,
      userId,
      date: dto.date ? new Date(dto.date) : new Date(),
    };

    const record = await this.maintenanceRepository.create(recordData);

    // Invalidate cache
    await this.invalidateVehicleCache(vehicleId);

    return record;
  }

  private async invalidateVehicleCache(vehicleId: string): Promise<void> {
    await this.cacheManager.del(`maintenance_vehicle_${vehicleId}`);
  }
}
