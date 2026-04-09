import type { Cache } from 'cache-manager';
import { IVehicleReminderRepository } from '../../domain/repositories/vehicle-reminder.repository.interface';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
export declare class DeleteVehicleReminderUseCase {
    private readonly reminderRepository;
    private readonly vehicleRepository;
    private readonly cacheManager;
    constructor(reminderRepository: IVehicleReminderRepository, vehicleRepository: IVehicleRepository, cacheManager: Cache);
    execute(reminderId: string, userId: string): Promise<void>;
    private invalidateVehicleCache;
}
