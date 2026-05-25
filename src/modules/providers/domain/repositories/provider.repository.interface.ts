import { ProviderEntity } from '../entities/provider.entity';
import { NearbyProviderDto, ProviderQueryDto } from '../../application/dtos/provider.dto';
import { ProviderStatus, RegistrationStatus } from '../../../../core/enums/status.enum';

export interface IProviderRepository {
  create(data: Partial<any>): Promise<ProviderEntity>;
  findAll(query: ProviderQueryDto): Promise<{ providers: ProviderEntity[]; total: number }>;
  findNearby(dto: NearbyProviderDto): Promise<(ProviderEntity & { distance: number })[]>;
  findById(id: string): Promise<ProviderEntity | null>;
  findByPhone(phone: string): Promise<ProviderEntity | null>;
  findTopRated(limit?: number): Promise<ProviderEntity[]>;
  update(id: string, data: Partial<any>): Promise<ProviderEntity>;
  updateLocation(id: string, longitude: number, latitude: number): Promise<ProviderEntity>;
  updateStatus(id: string, status: ProviderStatus): Promise<ProviderEntity>;
  updateRegistrationStatus(id: string, status: RegistrationStatus, reason?: string): Promise<ProviderEntity>;
  updateRating(id: string, averageRating: number, totalReviews: number): Promise<void>;
  incrementOrderCount(id: string): Promise<void>;
  approve(id: string): Promise<ProviderEntity>;
  setActive(id: string, isActive: boolean): Promise<ProviderEntity>;
  getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    approved: number;
    pending: number;
    rejected: number;
    online: number;
    busy: number;
    offline: number;
  }>;
  getProvidersByGovernorate(): Promise<{ _id: string; count: number }[]>;
}

export const IProviderRepository = Symbol('IProviderRepository');
