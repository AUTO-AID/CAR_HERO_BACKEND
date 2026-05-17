import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IServiceRepository } from '../../domain/repositories/service.repository.interface';
import { ServiceEntity } from '../../domain/entities/service.entity';
import { Service, ServiceDocument } from '../persistence/mongoose/schemas/service.schema';
import { ServiceCategory } from '../../../../core/enums/status.enum';

@Injectable()
export class MongooseServiceRepository implements IServiceRepository {
  constructor(
    @InjectModel(Service.name) private readonly serviceModel: Model<ServiceDocument>,
  ) {}

  private toObjectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Service not found');
    }
    return new Types.ObjectId(id);
  }

  private buildFilter(criteria: any = {}, activeDefault?: boolean): Record<string, any> {
    const filter: Record<string, any> = {};
    if (criteria.category) filter.category = criteria.category;
    if (criteria.isActive !== undefined) filter.isActive = criteria.isActive;
    else if (activeDefault !== undefined) filter.isActive = activeDefault;
    if (criteria.isEmergency !== undefined) filter.isEmergency = criteria.isEmergency;
    if (criteria.isSystemService !== undefined) filter.isSystemService = criteria.isSystemService;
    if (criteria.provider) filter.provider = new Types.ObjectId(criteria.provider);
    if (criteria.search) {
      const searchRegex = new RegExp(criteria.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { name: searchRegex },
        { nameAr: searchRegex },
        { description: searchRegex },
        { descriptionAr: searchRegex },
      ];
    }
    return filter;
  }

  private mapToEntity(doc: ServiceDocument): ServiceEntity {
    return new ServiceEntity(
      (doc as any)._id.toString(),
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

  async findPaginated(criteria: {
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
  }> {
    const page = Math.max(Number(criteria.page) || 1, 1);
    const limit = Math.max(Number(criteria.limit) || 10, 1);
    const filter = this.buildFilter(criteria);
    const [docs, total] = await Promise.all([
      this.serviceModel.find(filter).sort({ sortOrder: 1, name: 1 }).skip((page - 1) * limit).limit(limit).exec(),
      this.serviceModel.countDocuments(filter).exec(),
    ]);

    return {
      services: docs.map(doc => this.mapToEntity(doc)),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async findByCategory(category: ServiceCategory): Promise<ServiceEntity[]> {
    const docs = await this.serviceModel.find({ category, isActive: true }).sort({ sortOrder: 1 }).exec();
    return docs.map(doc => this.mapToEntity(doc));
  }

  async findById(id: string): Promise<ServiceEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.serviceModel.findById(id).exec();
    return doc ? this.mapToEntity(doc) : null;
  }

  async create(data: Partial<ServiceEntity>): Promise<ServiceEntity> {
    const doc = new this.serviceModel(data);
    await doc.save();
    return this.mapToEntity(doc);
  }

  async update(id: string, data: Partial<ServiceEntity>): Promise<ServiceEntity> {
    this.toObjectId(id);
    const doc = await this.serviceModel.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!doc) throw new NotFoundException('Service not found');
    return this.mapToEntity(doc);
  }

  async delete(id: string): Promise<boolean> {
    this.toObjectId(id);
    const result = await this.serviceModel.findByIdAndUpdate(
      id,
      { $set: { isActive: false, 'metadata.deletedAt': new Date() } },
      { new: true },
    ).exec();
    return !!result;
  }

  async findSystemServices(): Promise<ServiceEntity[]> {
    const docs = await this.serviceModel.find({ isSystemService: true, isActive: true }).sort({ sortOrder: 1 }).exec();
    return docs.map(doc => this.mapToEntity(doc));
  }

  async search(query: string, activeOnly: boolean = true): Promise<ServiceEntity[]> {
    const docs = await this.serviceModel
      .find(this.buildFilter({ search: query }, activeOnly))
      .sort({ sortOrder: 1, name: 1 })
      .limit(30)
      .exec();
    return docs.map(doc => this.mapToEntity(doc));
  }

  async getCategories(): Promise<Array<{ category: ServiceCategory; count: number }>> {
    const stats = await this.serviceModel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]).exec();
    return stats.map(item => ({ category: item._id, count: item.count }));
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    emergency: number;
    system: number;
    provider: number;
  }> {
    const [total, active, emergency, system] = await Promise.all([
      this.serviceModel.countDocuments().exec(),
      this.serviceModel.countDocuments({ isActive: true }).exec(),
      this.serviceModel.countDocuments({ isEmergency: true }).exec(),
      this.serviceModel.countDocuments({ isSystemService: true }).exec(),
    ]);

    return {
      total,
      active,
      inactive: Math.max(total - active, 0),
      emergency,
      system,
      provider: Math.max(total - system, 0),
    };
  }
}
