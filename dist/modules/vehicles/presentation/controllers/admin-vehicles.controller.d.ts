import { GetUserVehiclesUseCase } from '../../application/use-cases/get-user-vehicles.use-case';
import { GetAllVehiclesAdminUseCase } from '../../application/use-cases/get-all-vehicles-admin.use-case';
import { GetVehicleDetailsAdminUseCase } from '../../application/use-cases/get-vehicle-details-admin.use-case';
import { DeleteVehicleAdminUseCase } from '../../application/use-cases/delete-vehicle-admin.use-case';
import { GetVehicleStatsUseCase } from '../../application/use-cases/get-vehicle-stats.use-case';
import { GetTopVehicleModelsUseCase } from '../../application/use-cases/get-top-vehicle-models.use-case';
import { GetVehicleDistributionUseCase } from '../../application/use-cases/get-vehicle-distribution.use-case';
import { GetVehicleYearStatsUseCase } from '../../application/use-cases/get-vehicle-year-stats.use-case';
export declare class AdminVehiclesController {
    private readonly getUserVehiclesUseCase;
    private readonly getAllVehiclesAdminUseCase;
    private readonly getVehicleDetailsAdminUseCase;
    private readonly deleteVehicleAdminUseCase;
    private readonly getVehicleStatsUseCase;
    private readonly getTopVehicleModelsUseCase;
    private readonly getVehicleDistributionUseCase;
    private readonly getVehicleYearStatsUseCase;
    constructor(getUserVehiclesUseCase: GetUserVehiclesUseCase, getAllVehiclesAdminUseCase: GetAllVehiclesAdminUseCase, getVehicleDetailsAdminUseCase: GetVehicleDetailsAdminUseCase, deleteVehicleAdminUseCase: DeleteVehicleAdminUseCase, getVehicleStatsUseCase: GetVehicleStatsUseCase, getTopVehicleModelsUseCase: GetTopVehicleModelsUseCase, getVehicleDistributionUseCase: GetVehicleDistributionUseCase, getVehicleYearStatsUseCase: GetVehicleYearStatsUseCase);
    getAllVehicles(page: number, limit: number): Promise<{
        vehicles: import("../../domain/entities/vehicle.entity").VehicleEntity[];
        pagination: any;
    }>;
    getVehicleStats(): Promise<{
        stats: {
            brand: string;
            count: number;
        }[];
        total: number;
    }>;
    getTopModels(limit: number): Promise<{
        brand: string;
        model: string;
        count: number;
    }[]>;
    getDistribution(): Promise<{
        brand: string;
        count: number;
        percentage: number;
    }[]>;
    getYearStats(): Promise<{
        year: number;
        count: number;
    }[]>;
    getVehicleById(id: string): Promise<import("../../domain/entities/vehicle.entity").VehicleEntity>;
    deleteVehicle(id: string): Promise<void>;
    getUserVehicles(userId: string, page: number, limit: number): Promise<{
        vehicles: import("../../domain/entities/vehicle.entity").VehicleEntity[];
        pagination: any;
    }>;
}
