import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleEntity } from '../../domain/entities/vehicle.entity';
export declare class GetVehicleDetailsAdminUseCase {
    private readonly vehicleRepository;
    constructor(vehicleRepository: IVehicleRepository);
    execute(vehicleId: string): Promise<VehicleEntity>;
}
