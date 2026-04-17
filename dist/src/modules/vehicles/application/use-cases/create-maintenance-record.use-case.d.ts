import type { Cache } from 'cache-manager';
import { IMaintenanceRecordRepository } from '../../domain/repositories/maintenance-record.repository.interface';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { MaintenanceRecordEntity } from '../../domain/entities/maintenance-record.entity';
import { CreateMaintenanceRecordDto } from '../dto/create-maintenance-record.dto';
export declare class CreateMaintenanceRecordUseCase {
    private readonly maintenanceRepository;
    private readonly vehicleRepository;
    private readonly cacheManager;
    constructor(maintenanceRepository: IMaintenanceRecordRepository, vehicleRepository: IVehicleRepository, cacheManager: Cache);
    execute(vehicleId: string, dto: CreateMaintenanceRecordDto, userId: string): Promise<MaintenanceRecordEntity>;
    private invalidateVehicleCache;
}
