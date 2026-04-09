/**
 * Delete Vehicle Reminder Use Case
 * Deletes a maintenance reminder with ownership verification
 */
import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { IVehicleReminderRepository } from '../../domain/repositories/vehicle-reminder.repository.interface';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';

@Injectable()
export class DeleteVehicleReminderUseCase {
  constructor(
    @Inject(IVehicleReminderRepository)
    private readonly reminderRepository: IVehicleReminderRepository,
    @Inject(IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async execute(reminderId: string, userId: string): Promise<void> {
    // Find reminder
    const reminder = await this.reminderRepository.findById(reminderId);
    if (!reminder) {
      throw new NotFoundException('Reminder not found');
    }

    // Verify vehicle ownership
    const belongsToUser = await this.vehicleRepository.belongsToUser(reminder.vehicleId, userId);
    if (!belongsToUser) {
      throw new ForbiddenException('You do not have permission to delete this reminder');
    }

    // Delete reminder
    const deleted = await this.reminderRepository.delete(reminderId);
    if (!deleted) {
      throw new NotFoundException('Failed to delete reminder');
    }

    // Invalidate cache
    await this.invalidateVehicleCache(reminder.vehicleId);
  }

  private async invalidateVehicleCache(vehicleId: string): Promise<void> {
    await this.cacheManager.del(`reminders_vehicle_${vehicleId}`);
    await this.cacheManager.del(`reminders_vehicle_${vehicleId}_page_1_limit_20`);
  }
}
