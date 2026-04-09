import { VehicleEntity } from '../entities/vehicle.entity';
export interface IVehicleRepository {
    create(vehicle: Partial<VehicleEntity>): Promise<VehicleEntity>;
    findById(id: string): Promise<VehicleEntity | null>;
    findByUserId(userId: string, skip?: number, limit?: number): Promise<{
        vehicles: VehicleEntity[];
        total: number;
    }>;
    findDefaultByUserId(userId: string): Promise<VehicleEntity | null>;
    update(id: string, data: Partial<VehicleEntity>): Promise<VehicleEntity>;
    delete(id: string): Promise<boolean>;
    setAsDefault(userId: string, vehicleId: string): Promise<VehicleEntity>;
    countByUserId(userId: string): Promise<number>;
    belongsToUser(vehicleId: string, userId: string): Promise<boolean>;
    search(query: string, userId?: string, skip?: number, limit?: number): Promise<{
        vehicles: VehicleEntity[];
        total: number;
    }>;
    findByUserIdAdmin(userId: string, skip?: number, limit?: number): Promise<{
        vehicles: VehicleEntity[];
        total: number;
    }>;
    findAll(skip?: number, limit?: number): Promise<{
        vehicles: VehicleEntity[];
        total: number;
    }>;
    getStatsByBrand(): Promise<{
        brand: string;
        count: number;
    }[]>;
    getTopModels(limit?: number): Promise<{
        brand: string;
        model: string;
        count: number;
    }[]>;
    getDistribution(): Promise<{
        brand: string;
        count: number;
        percentage: number;
    }[]>;
    getStatsByYear(): Promise<{
        year: number;
        count: number;
    }[]>;
}
export declare const IVehicleRepository: unique symbol;
