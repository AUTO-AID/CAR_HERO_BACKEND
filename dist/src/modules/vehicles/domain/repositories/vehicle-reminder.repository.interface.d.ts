import { VehicleReminderEntity } from '../entities/vehicle-reminder.entity';
export interface IVehicleReminderRepository {
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
export declare const IVehicleReminderRepository: unique symbol;
