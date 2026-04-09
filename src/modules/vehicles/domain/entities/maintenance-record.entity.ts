/**
 * Maintenance Record Entity
 * Domain entity representing a vehicle maintenance/service record
 */

export class MaintenanceRecordEntity {
  constructor(
    public readonly id: string,
    public readonly vehicleId: string,
    public readonly userId: string,
    public readonly serviceType: string,
    public readonly description?: string,
    public readonly date?: Date,
    public readonly mileage?: number,
    public readonly cost?: number,
    public readonly provider?: string,
    public readonly location?: string,
    public readonly invoiceNumber?: string,
    public readonly parts?: string[],
    public readonly notes?: string,
    public readonly attachments?: string[],
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  /**
   * Generate a display label for the maintenance record
   */
  getDisplayLabel(): string {
    const parts = [this.serviceType];
    if (this.date) {
      parts.push(new Date(this.date).toLocaleDateString('ar'));
    }
    return parts.join(' - ');
  }

  /**
   * Check if record has detailed information
   */
  hasDetails(): boolean {
    return !!(this.description || this.mileage || this.cost || this.parts?.length);
  }
}
