import type { Cache } from 'cache-manager';
import { IVehicleReminderRepository } from '../../domain/repositories/vehicle-reminder.repository.interface';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleReminderEntity } from '../../domain/entities/vehicle-reminder.entity';
export declare class GetVehicleRemindersUseCase {
    private readonly reminderRepository;
    private readonly vehicleRepository;
    private readonly cacheManager;
    constructor(reminderRepository: IVehicleReminderRepository, vehicleRepository: IVehicleRepository, cacheManager: Cache);
    execute(vehicleId: string, userId: string, page?: number, limit?: number): Promise<{
        reminders: VehicleReminderEntity[];
        pagination: any;
    }>;
}
