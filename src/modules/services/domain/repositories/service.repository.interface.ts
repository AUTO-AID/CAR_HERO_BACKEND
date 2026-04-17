import { ServiceEntity } from '../entities/service.entity';
import { ServiceCategory } from '../../../../core/enums/status.enum';

export interface IServiceRepository {
  findAll(filter?: any): Promise<ServiceEntity[]>;
  findByCategory(category: ServiceCategory): Promise<ServiceEntity[]>;
  findById(id: string): Promise<ServiceEntity | null>;
  create(data: Partial<ServiceEntity>): Promise<ServiceEntity>;
  update(id: string, data: Partial<ServiceEntity>): Promise<ServiceEntity>;
  delete(id: string): Promise<boolean>;
  findSystemServices(): Promise<ServiceEntity[]>;
}

export const IServiceRepository = Symbol('IServiceRepository');
