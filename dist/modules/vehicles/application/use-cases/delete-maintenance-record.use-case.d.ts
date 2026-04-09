import type { Cache } from 'cache-manager';
import { IMaintenanceRecordRepository } from '../../domain/repositories/maintenance-record.repository.interface';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
export declare class DeleteMaintenanceRecordUseCase {
    private readonly maintenanceRepository;
    private readonly vehicleRepository;
    private readonly cacheManager;
    constructor(maintenanceRepository: IMaintenanceRecordRepository, vehicleRepository: IVehicleRepository, cacheManager: Cache);
    execute(recordId: string, userId: string): Promise<void>;
    private invalidateVehicleCache;
}
