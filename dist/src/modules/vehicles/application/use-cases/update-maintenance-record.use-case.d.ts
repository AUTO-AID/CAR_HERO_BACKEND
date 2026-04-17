import type { Cache } from 'cache-manager';
import { IMaintenanceRecordRepository } from '../../domain/repositories/maintenance-record.repository.interface';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { MaintenanceRecordEntity } from '../../domain/entities/maintenance-record.entity';
import { UpdateMaintenanceRecordDto } from '../dto/update-maintenance-record.dto';
export declare class UpdateMaintenanceRecordUseCase {
    private readonly maintenanceRepository;
    private readonly vehicleRepository;
    private readonly cacheManager;
    constructor(maintenanceRepository: IMaintenanceRecordRepository, vehicleRepository: IVehicleRepository, cacheManager: Cache);
    execute(recordId: string, dto: UpdateMaintenanceRecordDto, userId: string): Promise<MaintenanceRecordEntity>;
    private invalidateVehicleCache;
}
