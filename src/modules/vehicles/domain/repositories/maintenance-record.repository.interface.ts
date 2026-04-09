/**
 * Maintenance Record Repository Interface
 * Domain contract for maintenance records persistence
 */
import { MaintenanceRecordEntity } from '../entities/maintenance-record.entity';

export interface IMaintenanceRecordRepository {
  /**
   * Create a new maintenance record
   */
  create(record: Partial<MaintenanceRecordEntity>): Promise<MaintenanceRecordEntity>;

  /**
   * Find record by ID
   */
  findById(id: string): Promise<MaintenanceRecordEntity | null>;

  /**
   * Find all records for a specific vehicle
   */
  findByVehicleId(
    vehicleId: string,
    skip?: number,
    limit?: number,
  ): Promise<{ records: MaintenanceRecordEntity[]; total: number }>;

  /**
   * Update a maintenance record
   */
  update(id: string, data: Partial<MaintenanceRecordEntity>): Promise<MaintenanceRecordEntity>;

  /**
   * Delete a maintenance record
   */
  delete(id: string): Promise<boolean>;

  /**
   * Check if record belongs to a vehicle
   */
  belongsToVehicle(recordId: string, vehicleId: string): Promise<boolean>;

  /**
   * Count records for a vehicle
   */
  countByVehicleId(vehicleId: string): Promise<number>;
}

export const IMaintenanceRecordRepository = Symbol('IMaintenanceRecordRepository');
