import type { Cache } from 'cache-manager';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleEntity } from '../../domain/entities/vehicle.entity';
import { UpdateVehicleDto } from '../dto/update-vehicle.dto';
export declare class UpdateVehicleUseCase {
    private readonly vehicleRepository;
    private readonly cacheManager;
    constructor(vehicleRepository: IVehicleRepository, cacheManager: Cache);
    execute(vehicleId: string, dto: UpdateVehicleDto, userId: string): Promise<VehicleEntity>;
    private unsetOtherDefaults;
    private invalidateUserCache;
}
