import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleEntity } from '../../domain/entities/vehicle.entity';
export declare class GetAllVehiclesAdminUseCase {
    private readonly vehicleRepository;
    constructor(vehicleRepository: IVehicleRepository);
    execute(page?: number, limit?: number): Promise<{
        vehicles: VehicleEntity[];
        pagination: any;
    }>;
}
