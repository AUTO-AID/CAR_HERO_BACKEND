import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IServiceRepository } from '../../domain/repositories/service.repository.interface';
import { ServiceEntity } from '../../domain/entities/service.entity';
import { Service, ServiceDocument } from '../../../../modules/services/infrastructure/persistence/mongoose/schemas/service.schema';
import { ServiceCategory } from '../../../../core/enums/status.enum';

@Injectable()
export class MongooseServiceRepository implements IServiceRepository {
  constructor(
    @InjectModel(Service.name) private readonly serviceModel: Model<ServiceDocument>,
  ) {}

  private mapToEntity(doc: ServiceDocument): ServiceEntity {
    return new ServiceEntity(
      doc._id.toString(),
      doc.name,
      doc.nameAr,
      doc.category,
      doc.basePrice,
      doc.estimatedDuration,
      doc.isActive,
      doc.description,
      doc.descriptionAr,
      doc.icon,
      doc.image,
      doc.discountedPrice,
      doc.isEmergency,
      doc.sortOrder,
      doc.provider?.toString(),
      doc.isSystemService,
      doc.options,
      doc.metadata,
      (doc as any).createdAt,
      (doc as any).updatedAt,
    );
  }

  async findAll(filter: any = {}): Promise<ServiceEntity[]> {
    const docs = await this.serviceModel.find(filter).sort({ sortOrder: 1, name: 1 }).exec();
    return docs.map(doc => this.mapToEntity(doc));
  }

  async findByCategory(category: ServiceCategory): Promise<ServiceEntity[]> {
    const docs = await this.serviceModel.find({ category, isActive: true }).sort({ sortOrder: 1 }).exec();
    return docs.map(doc => this.mapToEntity(doc));
  }

  async findById(id: string): Promise<ServiceEntity | null> {
    const doc = await this.serviceModel.findById(id).exec();
    return doc ? this.mapToEntity(doc) : null;
  }

  async create(data: Partial<ServiceEntity>): Promise<ServiceEntity> {
    const doc = new this.serviceModel(data);
    await doc.save();
    return this.mapToEntity(doc);
  }

  async update(id: string, data: Partial<ServiceEntity>): Promise<ServiceEntity> {
    const doc = await this.serviceModel.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!doc) throw new NotFoundException('Service not found');
    return this.mapToEntity(doc);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.serviceModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async findSystemServices(): Promise<ServiceEntity[]> {
    const docs = await this.serviceModel.find({ isSystemService: true, isActive: true }).sort({ sortOrder: 1 }).exec();
    return docs.map(doc => this.mapToEntity(doc));
  }
}
