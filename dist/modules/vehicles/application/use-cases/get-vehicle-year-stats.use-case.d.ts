import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
export declare class GetVehicleYearStatsUseCase {
    private readonly vehicleRepository;
    constructor(vehicleRepository: IVehicleRepository);
    execute(): Promise<{
        year: number;
        count: number;
    }[]>;
}
