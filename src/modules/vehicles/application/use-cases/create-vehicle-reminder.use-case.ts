/**
 * Create Vehicle Reminder Use Case
 * Creates a new periodic maintenance reminder for a vehicle
 */
import { Inject, Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { IVehicleReminderRepository } from '../../domain/repositories/vehicle-reminder.repository.interface';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleReminderEntity } from '../../domain/entities/vehicle-reminder.entity';
import { CreateVehicleReminderDto } from '../dto/create-vehicle-reminder.dto';

@Injectable()
export class CreateVehicleReminderUseCase {
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
    dto: CreateVehicleReminderDto,
    userId: string,
  ): Promise<VehicleReminderEntity> {
    // Verify vehicle ownership
    const belongsToUser = await this.vehicleRepository.belongsToUser(vehicleId, userId);
    if (!belongsToUser) {
      throw new ForbiddenException('You do not have permission to add reminders to this vehicle');
    }

    // Verify vehicle exists
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // Validate: either reminderDate or mileageThreshold must be provided
    if (!dto.reminderDate && !dto.mileageThreshold) {
      throw new BadRequestException('Either reminderDate or mileageThreshold must be provided');
    }

    // Check max reminders limit (prevent spam)
    const count = await this.reminderRepository.countByVehicleId(vehicleId);
    if (count >= 20) {
      throw new BadRequestException('Maximum number of reminders reached (20). Please remove some first.');
    }

    // Create reminder
    const reminderData: Partial<VehicleReminderEntity> = {
      ...dto,
      vehicleId,
      userId,
      isActive: true,
      reminderDate: dto.reminderDate ? new Date(dto.reminderDate) : undefined,
    };

    const reminder = await this.reminderRepository.create(reminderData);

    // Invalidate cache
    await this.invalidateVehicleCache(vehicleId);

    return reminder;
  }

  private async invalidateVehicleCache(vehicleId: string): Promise<void> {
    await this.cacheManager.del(`reminders_vehicle_${vehicleId}`);
  }
}
