import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
export declare class GetVehicleDistributionUseCase {
    private readonly vehicleRepository;
    constructor(vehicleRepository: IVehicleRepository);
    execute(): Promise<{
        brand: string;
        count: number;
        percentage: number;
    }[]>;
}
