import type { Cache } from 'cache-manager';
import { IMaintenanceRecordRepository } from '../../domain/repositories/maintenance-record.repository.interface';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { MaintenanceRecordEntity } from '../../domain/entities/maintenance-record.entity';
export declare class GetVehicleMaintenanceUseCase {
    private readonly maintenanceRepository;
    private readonly vehicleRepository;
    private readonly cacheManager;
    constructor(maintenanceRepository: IMaintenanceRecordRepository, vehicleRepository: IVehicleRepository, cacheManager: Cache);
    execute(vehicleId: string, userId: string, page?: number, limit?: number): Promise<{
        records: MaintenanceRecordEntity[];
        pagination: any;
    }>;
}
