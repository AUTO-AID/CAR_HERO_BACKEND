import type { Cache } from 'cache-manager';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
export declare class DeleteVehicleUseCase {
    private readonly vehicleRepository;
    private readonly cacheManager;
    constructor(vehicleRepository: IVehicleRepository, cacheManager: Cache);
    execute(vehicleId: string, userId: string): Promise<void>;
    private setDefaultAnotherVehicle;
    private invalidateUserCache;
}
