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

    const cacheKey = `reminders_vehicle_${vehicleId}_page_${page}_limit_${limit}`;

    // Try to get from cache
    const cached = await this.cacheManager.get<{ reminders: VehicleReminderEntity[]; pagination: any }>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const skip = (page - 1) * limit;
    const { reminders, total } = await this.reminderRepository.findByVehicleId(vehicleId, skip, limit);

    const result = {
      reminders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };

    // Save to cache (10 minutes)
    await this.cacheManager.set(cacheKey, result, 600000);

    return result;
  }
}
