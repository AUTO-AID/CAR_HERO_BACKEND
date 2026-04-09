import { ReminderType, ReminderFrequency } from '../../domain/entities/vehicle-reminder.entity';
export declare class CreateVehicleReminderDto {
    type: ReminderType;
    title: string;
    description?: string;
    reminderDate?: string;
    mileageThreshold?: number;
    currentMileage?: number;
    frequency?: ReminderFrequency;
    isRecurring?: boolean;
    notes?: string;
}
