import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
export declare class GetVehicleStatsUseCase {
    private readonly vehicleRepository;
    constructor(vehicleRepository: IVehicleRepository);
    execute(): Promise<{
        stats: {
            brand: string;
            count: number;
        }[];
        total: number;
    }>;
}
