import type { Cache } from 'cache-manager';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleEntity } from '../../domain/entities/vehicle.entity';
export declare class GetUserVehiclesUseCase {
    private readonly vehicleRepository;
    private readonly cacheManager;
    constructor(vehicleRepository: IVehicleRepository, cacheManager: Cache);
    execute(userId: string, page?: number, limit?: number): Promise<{
        vehicles: VehicleEntity[];
        pagination: any;
    }>;
}
