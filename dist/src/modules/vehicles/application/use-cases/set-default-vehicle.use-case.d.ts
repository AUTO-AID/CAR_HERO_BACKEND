import type { Cache } from 'cache-manager';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleEntity } from '../../domain/entities/vehicle.entity';
export declare class SetDefaultVehicleUseCase {
    private readonly vehicleRepository;
    private readonly cacheManager;
    constructor(vehicleRepository: IVehicleRepository, cacheManager: Cache);
    execute(vehicleId: string, userId: string): Promise<VehicleEntity>;
    private invalidateUserCache;
}
