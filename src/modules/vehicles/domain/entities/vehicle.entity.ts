/**
 * Vehicle Entity
 * Domain entity representing a user's registered vehicle
 */

export class VehicleEntity {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly brand: string,
    public readonly model: string,
    public readonly year: number,
    public readonly plateNumber: string,
    public readonly color?: string,
    public readonly fuelType?: string,
    public readonly transmission?: string,
    public readonly engineType?: string,
    public readonly vin?: string,
    public readonly plateType?: string,
    public readonly images?: string[],
    public readonly isDefault?: boolean,
    public readonly isActive?: boolean,
    public readonly metadata?: Record<string, any>,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  /**
   * Generate a display name for the vehicle
   */
  getDisplayName(): string {
    const parts = [this.brand, this.model, this.year.toString()];
    return parts.filter(Boolean).join(' ');
  }

  /**
   * Check if vehicle year is valid (not in future, not too old)
   */
  isValidYear(currentYear: number): boolean {
    return this.year >= 1900 && this.year <= currentYear + 1;
  }

  /**
   * Check if VIN format is valid (17 characters)
   */
  isValidVin(): boolean {
    if (!this.vin) return true; // Optional
    return this.vin.length === 17;
  }
}
