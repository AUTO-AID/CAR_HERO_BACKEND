import { Model } from 'mongoose';
import { IVehicleReminderRepository } from '../../domain/repositories/vehicle-reminder.repository.interface';
import { VehicleReminderEntity } from '../../domain/entities/vehicle-reminder.entity';
import { VehicleReminderDocument } from './vehicle-reminder.schema';
export declare class MongooseVehicleReminderRepository implements IVehicleReminderRepository {
    private readonly reminderModel;
    constructor(reminderModel: Model<VehicleReminderDocument>);
    private mapToEntity;
    create(reminder: Partial<VehicleReminderEntity>): Promise<VehicleReminderEntity>;
    findById(id: string): Promise<VehicleReminderEntity | null>;
    findByVehicleId(vehicleId: string, skip?: number, limit?: number): Promise<{
        reminders: VehicleReminderEntity[];
        total: number;
    }>;
    findActiveByVehicleId(vehicleId: string): Promise<VehicleReminderEntity[]>;
    delete(id: string): Promise<boolean>;
    belongsToVehicle(reminderId: string, vehicleId: string): Promise<boolean>;
    countByVehicleId(vehicleId: string): Promise<number>;
    findOverdueReminders(): Promise<VehicleReminderEntity[]>;
}
