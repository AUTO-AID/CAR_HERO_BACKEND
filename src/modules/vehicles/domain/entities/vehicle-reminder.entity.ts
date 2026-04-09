/**
 * Vehicle Reminder Entity
 * Domain entity representing a periodic maintenance reminder
 */

export enum ReminderType {
  OIL_CHANGE = 'oil_change',
  FILTER_CHANGE = 'filter_change',
  TIRE_ROTATION = 'tire_rotation',
  BRAKE_CHECK = 'brake_check',
  BATTERY_CHECK = 'battery_check',
  GENERAL_INSPECTION = 'general_inspection',
  CUSTOM = 'custom',
}

export enum ReminderFrequency {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMI_ANNUAL = 'semi_annual',
  ANNUAL = 'annual',
  CUSTOM_KM = 'custom_km',
}

export class VehicleReminderEntity {
  constructor(
    public readonly id: string,
    public readonly vehicleId: string,
    public readonly userId: string,
    public readonly type: ReminderType,
    public readonly title: string,
    public readonly description?: string,
    public readonly reminderDate?: Date,
    public readonly mileageThreshold?: number,
    public readonly currentMileage?: number,
    public readonly frequency?: ReminderFrequency,
    public readonly isActive?: boolean,
    public readonly isRecurring?: boolean,
    public readonly lastTriggeredAt?: Date,
    public readonly notes?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  /**
   * Check if reminder should be triggered based on mileage
   */
  shouldTriggerByMileage(): boolean {
    if (!this.mileageThreshold || !this.currentMileage) return false;
    return this.currentMileage >= this.mileageThreshold;
  }

  /**
   * Check if reminder is overdue
   */
  isOverdue(): boolean {
    if (!this.reminderDate) return false;
    return new Date() > this.reminderDate;
  }

  /**
   * Get display label for the reminder
   */
  getDisplayLabel(): string {
    const parts = [this.title];
    if (this.reminderDate) {
      parts.push(new Date(this.reminderDate).toLocaleDateString('ar'));
    }
    if (this.mileageThreshold) {
      parts.push(`عند ${this.mileageThreshold.toLocaleString()} كم`);
    }
    return parts.join(' - ');
  }
}
