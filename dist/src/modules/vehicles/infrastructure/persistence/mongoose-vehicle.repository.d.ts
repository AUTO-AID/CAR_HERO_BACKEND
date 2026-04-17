import { Model } from 'mongoose';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleEntity } from '../../domain/entities/vehicle.entity';
import { VehicleDocument } from './mongoose/schemas/vehicle.schema';
export declare class MongooseVehicleRepository implements IVehicleRepository {
    private readonly vehicleModel;
    constructor(vehicleModel: Model<VehicleDocument>);
    private mapToEntity;
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
