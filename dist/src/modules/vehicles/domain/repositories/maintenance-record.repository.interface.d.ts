import { MaintenanceRecordEntity } from '../entities/maintenance-record.entity';
export interface IMaintenanceRecordRepository {
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
export declare const IMaintenanceRecordRepository: unique symbol;
