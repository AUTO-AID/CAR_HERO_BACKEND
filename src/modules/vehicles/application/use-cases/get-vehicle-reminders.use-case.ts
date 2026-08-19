/**
 * Get Vehicle Reminders Use Case
 * Retrieves all maintenance reminders for a vehicle
 */
import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { IVehicleReminderRepository } from '../../domain/repositories/vehicle-reminder.repository.interface';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleReminderEntity } from '../../domain/entities/vehicle-reminder.entity';

@Injectable()
export class GetVehicleRemindersUseCase {
  constructor(
    @Inject(IVehicleReminderRepository)
    private readonly reminderRepository: IVehicleReminderRepository,
    @Inject(IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async execute(
    vehicleId: string,
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ reminders: VehicleReminderEntity[]; pagination: any }> {
    // Verify vehicle ownership
    const belongsToUser = await this.vehicleRepository.belongsToUser(vehicleId, userId);
    if (!belongsToUser) {
      throw new ForbiddenException('You do not have permission to view this vehicle reminders');
    }

    // Verify vehicle exists
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // NOT cached on purpose — see GetVehicleMaintenanceUseCase: the paginated read
    // key was never invalidated by CreateVehicleReminderUseCase (it deletes only
    // `reminders_vehicle_<id>`), so a reminder the user just created stayed
    // invisible for up to 10 minutes.
    const skip = (page - 1) * limit;
    const { reminders, total } = await this.reminderRepository.findByVehicleId(vehicleId, skip, limit);

    return {
      reminders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
