import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
export declare class DeleteVehicleAdminUseCase {
    private readonly vehicleRepository;
    constructor(vehicleRepository: IVehicleRepository);
    execute(vehicleId: string): Promise<void>;
}
