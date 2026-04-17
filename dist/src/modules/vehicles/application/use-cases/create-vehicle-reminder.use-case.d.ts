import type { Cache } from 'cache-manager';
import { IVehicleReminderRepository } from '../../domain/repositories/vehicle-reminder.repository.interface';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleReminderEntity } from '../../domain/entities/vehicle-reminder.entity';
import { CreateVehicleReminderDto } from '../dto/create-vehicle-reminder.dto';
export declare class CreateVehicleReminderUseCase {
    private readonly reminderRepository;
    private readonly vehicleRepository;
    private readonly cacheManager;
    constructor(reminderRepository: IVehicleReminderRepository, vehicleRepository: IVehicleRepository, cacheManager: Cache);
    execute(vehicleId: string, dto: CreateVehicleReminderDto, userId: string): Promise<VehicleReminderEntity>;
    private invalidateVehicleCache;
}
