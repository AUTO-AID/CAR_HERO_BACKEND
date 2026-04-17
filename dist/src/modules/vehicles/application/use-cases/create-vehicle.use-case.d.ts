import type { Cache } from 'cache-manager';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleEntity } from '../../domain/entities/vehicle.entity';
import { CreateVehicleDto } from '../dto/create-vehicle.dto';
export declare class CreateVehicleUseCase {
    private readonly vehicleRepository;
    private readonly cacheManager;
    constructor(vehicleRepository: IVehicleRepository, cacheManager: Cache);
    execute(dto: CreateVehicleDto, userId: string): Promise<VehicleEntity>;
    private unsetOtherDefaults;
    private invalidateUserCache;
}
