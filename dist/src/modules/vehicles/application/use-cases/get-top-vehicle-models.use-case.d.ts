import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
export declare class GetTopVehicleModelsUseCase {
    private readonly vehicleRepository;
    constructor(vehicleRepository: IVehicleRepository);
    execute(limit?: number): Promise<{
        brand: string;
        model: string;
        count: number;
    }[]>;
}
