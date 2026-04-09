/**
 * Vehicle Reminder Repository Interface
 * Domain contract for vehicle reminder persistence
 */
import { VehicleReminderEntity } from '../entities/vehicle-reminder.entity';

export interface IVehicleReminderRepository {
  /**
   * Create a new reminder
   */
  create(reminder: Partial<VehicleReminderEntity>): Promise<VehicleReminderEntity>;

  /**
   * Find reminder by ID
   */
  findById(id: string): Promise<VehicleReminderEntity | null>;

  /**
   * Find all reminders for a specific vehicle
   */
  findByVehicleId(
    vehicleId: string,
    skip?: number,
    limit?: number,
  ): Promise<{ reminders: VehicleReminderEntity[]; total: number }>;

  /**
   * Find active (non-deleted) reminders for a vehicle
   */
  findActiveByVehicleId(vehicleId: string): Promise<VehicleReminderEntity[]>;

  /**
   * Delete a reminder (soft or hard)
   */
  delete(id: string): Promise<boolean>;

  /**
   * Check if reminder belongs to a vehicle
   */
  belongsToVehicle(reminderId: string, vehicleId: string): Promise<boolean>;

  /**
   * Count reminders for a vehicle
   */
  countByVehicleId(vehicleId: string): Promise<number>;

  /**
   * Find overdue reminders
   */
  findOverdueReminders(): Promise<VehicleReminderEntity[]>;
}

export const IVehicleReminderRepository = Symbol('IVehicleReminderRepository');
