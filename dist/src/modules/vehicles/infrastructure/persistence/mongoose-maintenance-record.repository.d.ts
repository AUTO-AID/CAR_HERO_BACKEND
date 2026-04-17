import { Model } from 'mongoose';
import { IMaintenanceRecordRepository } from '../../domain/repositories/maintenance-record.repository.interface';
import { MaintenanceRecordEntity } from '../../domain/entities/maintenance-record.entity';
import { MaintenanceRecordDocument } from './maintenance-record.schema';
export declare class MongooseMaintenanceRecordRepository implements IMaintenanceRecordRepository {
    private readonly recordModel;
    constructor(recordModel: Model<MaintenanceRecordDocument>);
    private mapToEntity;
    create(record: Partial<MaintenanceRecordEntity>): Promise<MaintenanceRecordEntity>;
    findById(id: string): Promise<MaintenanceRecordEntity | null>;
    findByVehicleId(vehicleId: string, skip?: number, limit?: number): Promise<{
        records: MaintenanceRecordEntity[];
        total: number;
    }>;
    update(id: string, data: Partial<MaintenanceRecordEntity>): Promise<MaintenanceRecordEntity>;
    delete(id: string): Promise<boolean>;
    belongsToVehicle(recordId: string, vehicleId: string): Promise<boolean>;
    countByVehicleId(vehicleId: string): Promise<number>;
}
