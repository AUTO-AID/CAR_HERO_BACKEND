/**
 * Vehicle Repository Interface
 * Domain contract for vehicle persistence operations
 */
import { VehicleEntity } from '../entities/vehicle.entity';

export interface IVehicleRepository {
  /**
   * Create a new vehicle
   */
  create(vehicle: Partial<VehicleEntity>): Promise<VehicleEntity>;

  /**
   * Find vehicle by ID
   */
  findById(id: string): Promise<VehicleEntity | null>;

  /**
   * Find all vehicles for a specific user
   */
  findByUserId(userId: string, skip?: number, limit?: number): Promise<{ vehicles: VehicleEntity[]; total: number }>;

  /**
   * Find user's default vehicle
   */
  findDefaultByUserId(userId: string): Promise<VehicleEntity | null>;

  /**
   * Update vehicle details
   */
  update(id: string, data: Partial<VehicleEntity>): Promise<VehicleEntity>;

  /**
   * Delete vehicle
   */
  delete(id: string): Promise<boolean>;

  /**
   * Set a vehicle as default for a user (and unset others)
   */
  setAsDefault(userId: string, vehicleId: string): Promise<VehicleEntity>;

  /**
   * Count vehicles for a user
   */
  countByUserId(userId: string): Promise<number>;

  /**
   * Check if vehicle belongs to user
   */
  belongsToUser(vehicleId: string, userId: string): Promise<boolean>;

  /**
   * Search vehicles by brand, model, or plateNumber
   */
  search(query: string, userId?: string, skip?: number, limit?: number): Promise<{ vehicles: VehicleEntity[]; total: number }>;

  /**
   * Find all vehicles for a specific user (admin access)
   */
  findByUserIdAdmin(userId: string, skip?: number, limit?: number): Promise<{ vehicles: VehicleEntity[]; total: number }>;

  /**
   * Find all vehicles (admin access) with pagination
   */
  findAll(skip?: number, limit?: number): Promise<{ vehicles: VehicleEntity[]; total: number }>;

  /**
   * Get vehicle statistics by brand
   */
  getStatsByBrand(): Promise<{ brand: string; count: number }[]>;

  /**
   * Get top vehicle models by usage
   */
  getTopModels(limit?: number): Promise<{ brand: string; model: string; count: number }[]>;

  /**
   * Get vehicle distribution by brand
   */
  getDistribution(): Promise<{ brand: string; count: number; percentage: number }[]>;

  /**
   * Get vehicle statistics by year
   */
  getStatsByYear(): Promise<{ year: number; count: number }[]>;
}

export const IVehicleRepository = Symbol('IVehicleRepository');
