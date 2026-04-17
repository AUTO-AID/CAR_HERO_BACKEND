import { Model } from 'mongoose';
import { IServiceRepository } from '../../domain/repositories/service.repository.interface';
import { ServiceEntity } from '../../domain/entities/service.entity';
import { ServiceDocument } from '../../../../modules/services/infrastructure/persistence/mongoose/schemas/service.schema';
import { ServiceCategory } from '../../../../core/enums/status.enum';
export declare class MongooseServiceRepository implements IServiceRepository {
    private readonly serviceModel;
    constructor(serviceModel: Model<ServiceDocument>);
    private mapToEntity;
    findAll(filter?: any): Promise<ServiceEntity[]>;
    findByCategory(category: ServiceCategory): Promise<ServiceEntity[]>;
    findById(id: string): Promise<ServiceEntity | null>;
    create(data: Partial<ServiceEntity>): Promise<ServiceEntity>;
    update(id: string, data: Partial<ServiceEntity>): Promise<ServiceEntity>;
    delete(id: string): Promise<boolean>;
    findSystemServices(): Promise<ServiceEntity[]>;
}
