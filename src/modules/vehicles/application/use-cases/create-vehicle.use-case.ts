/**
 * Create Vehicle Use Case
 * Creates a new vehicle for the authenticated user
 */
import { Inject, Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleEntity } from '../../domain/entities/vehicle.entity';
import { CreateVehicleDto } from '../dto/create-vehicle.dto';
import { CheckSubscriptionStatusUseCase } from '../../../subscriptions/application/use-cases/check-subscription-status.use-case';

/** الحدّ المطلق — يُطبَّق على المشتركين أيضاً، لا سقف تحته وحده */
const ABSOLUTE_MAX_VEHICLES = 10;
/** «سيارة واحدة» في الباقة المجانية — نصّ الموقع حرفياً */
const FREE_TIER_MAX_VEHICLES = 1;

@Injectable()
export class CreateVehicleUseCase {
  constructor(
    @Inject(IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly checkSubscriptionStatus: CheckSubscriptionStatusUseCase,
  ) {}

  async execute(dto: CreateVehicleDto, userId: string): Promise<VehicleEntity> {
    // Validate year
    const currentYear = new Date().getFullYear();
    if (dto.year < 1900 || dto.year > currentYear + 1) {
      throw new BadRequestException(`Invalid year. Must be between 1900 and ${currentYear + 1}`);
    }

    // Validate VIN format if provided
    if (dto.vin && dto.vin.length !== 17) {
      throw new BadRequestException('VIN must be exactly 17 characters');
    }

    const vehicleCount = await this.vehicleRepository.countByUserId(userId);
    if (vehicleCount >= ABSOLUTE_MAX_VEHICLES) {
      throw new BadRequestException(`Maximum number of vehicles reached (${ABSOLUTE_MAX_VEHICLES}). Please remove a vehicle first.`);
    }

    /**
     * «سيارة واحدة» في الباقة المجانية مقابل «سيارات غير محدودة» في المميزة
     * (حتى السقف المطلق أعلاه) — نصّ الموقع حرفياً. العميل يعرض نفس الرسالة
     * كجدار اشتراك قبل هذه النقطة أصلاً؛ هذا الحارس هو الفاحص الحقيقي —
     * تجاوز الواجهة باستدعاء الـAPI مباشرة لا يفتح ثغرة.
     */
    if (vehicleCount >= FREE_TIER_MAX_VEHICLES) {
      const status = await this.checkSubscriptionStatus.execute(userId);
      if (!status.isActive) {
        throw new ForbiddenException(
          'Free plan is limited to 1 vehicle. Subscribe to Premium for unlimited vehicles.',
        );
      }
    }

    // If this is the first vehicle, make it default automatically
    const isDefault = vehicleCount === 0 ? true : (dto.isDefault ?? false);

    // Create vehicle (initially without default, we set it atomically after)
    const vehicleData: Partial<VehicleEntity> = {
      ...dto,
      userId,
      isDefault: vehicleCount === 0 ? true : false,
    };

    let vehicle = await this.vehicleRepository.create(vehicleData);

    // If it should be default and it's not the first vehicle, use atomic method
    if (isDefault && vehicleCount > 0) {
      vehicle = await this.vehicleRepository.setAsDefault(userId, vehicle.id);
    }

    // Invalidate cache
    await this.invalidateUserCache(userId);

    return vehicle;
  }

  /**
   * Invalidate all cached vehicles for user
   */
  private async invalidateUserCache(userId: string): Promise<void> {
    await this.cacheManager.del(`vehicles_user_${userId}`);
    await this.cacheManager.del(`vehicles_user_${userId}_default`);

    // The list endpoint caches under `vehicles_user_<id>_page_<n>_limit_<n>`, so the
    // exact-key deletes above never hit it — the paginated keys must be swept.
    // cache-manager v7 exposes `stores` (array); only older versions had `store`,
    // and the previous code checked `store` alone, so nothing was ever swept and a
    // newly added vehicle stayed invisible until the 60s TTL expired.
    try {
      let keys: string[] = [];
      const store = (this.cacheManager as any)?.store;
      const stores = (this.cacheManager as any)?.stores;

      if (store && typeof store.keys === 'function') {
        keys = await store.keys();
      } else if (stores && stores.length > 0 && typeof stores[0].keys === 'function') {
        keys = await stores[0].keys();
      }

      for (const key of keys || []) {
        if (
          key.includes(`vehicles_user_${userId}`) ||
          key.includes(`vehicles_search_user_${userId}`)
        ) {
          await this.cacheManager.del(key);
        }
      }
    } catch (error) {
      console.warn(
        `[Cache Warning] Failed to invalidate vehicle cache for user ${userId}:`,
        (error as Error)?.message,
      );
    }
  }
}
