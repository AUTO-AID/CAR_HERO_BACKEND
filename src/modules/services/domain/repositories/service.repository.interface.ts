import { ServiceEntity } from '../entities/service.entity';
import { ServiceCategory } from '../../../../core/enums/status.enum';

export interface IServiceRepository {
  findAll(filter?: any): Promise<ServiceEntity[]>;
  findPaginated(criteria: {
    page?: number;
    limit?: number;
    category?: ServiceCategory;
    search?: string;
    isActive?: boolean;
    isEmergency?: boolean;
    isSystemService?: boolean;
    provider?: string;
  }): Promise<{
    services: ServiceEntity[];
    pagination: { total: number; page: number; limit: number; pages: number };
  }>;
  findByCategory(category: ServiceCategory): Promise<ServiceEntity[]>;
  findById(id: string): Promise<ServiceEntity | null>;
  create(data: Partial<ServiceEntity>): Promise<ServiceEntity>;
  update(id: string, data: Partial<ServiceEntity>): Promise<ServiceEntity>;
  delete(id: string): Promise<boolean>;
  findSystemServices(): Promise<ServiceEntity[]>;
  search(query: string, activeOnly?: boolean): Promise<ServiceEntity[]>;
  getCategories(): Promise<Array<{ category: ServiceCategory; count: number }>>;
  getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    emergency: number;
    system: number;
    provider: number;
  }>;
}

export const IServiceRepository = Symbol('IServiceRepository');
