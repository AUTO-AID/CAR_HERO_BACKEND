import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IProviderRepository } from '../../domain/repositories/provider.repository.interface';
import { ProviderEntity } from '../../domain/entities/provider.entity';
import { Provider, ProviderDocument } from '../persistence/mongoose/schemas/provider.schema';
import { NearbyProviderDto, ProviderQueryDto } from '../../application/dtos/provider.dto';
import { getPaginationParams } from '../../../../core/utils/pagination.util';
import { ProviderStatus, RegistrationStatus } from '../../../../core/enums/status.enum';

@Injectable()
export class MongooseProviderRepository implements IProviderRepository {
  constructor(
    @InjectModel(Provider.name) private readonly providerModel: Model<ProviderDocument>,
  ) {}

  private ensureObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Provider not found');
    }
  }

  private mapToEntity(doc: ProviderDocument): ProviderEntity {
    return new ProviderEntity(
      (doc as any)._id.toString(),
      doc.phone,
      doc.businessName,
      doc.role,
      doc.status,
      doc.registrationStatus,
      doc.isApproved,
      doc.isActive,
      {
        type: doc.location.type,
        coordinates: doc.location.coordinates,
      },
      doc.serviceCategories,
      doc.averageRating,
      doc.totalReviews,
      doc.totalOrders,
      doc.email,
      doc.ownerName,
      doc.description,
      doc.logo,
      doc.images,
      doc.address,
      (doc.services || []).map(id => id.toString()),
      doc.workingHours,
      doc.documents,
      doc.bankAccount as any,
      doc.rejectionReason,
      doc.city,
      doc.lastOnlineAt,
      (doc as any).createdAt,
      (doc as any).updatedAt,
    );
  }

  async findAll(query: ProviderQueryDto): Promise<{ providers: ProviderEntity[]; total: number }> {
    const { skip, limit } = getPaginationParams(query);
    const filter: any = {};

    if (query.isActive !== undefined) filter.isActive = query.isActive;
    if (query.isApproved !== undefined) filter.isApproved = query.isApproved;
    if (query.registrationStatus) filter.registrationStatus = query.registrationStatus;
    if (query.status) filter.status = query.status;
    if (query.category) filter.serviceCategories = query.category;
    if (query.city) filter.city = { $regex: query.city, $options: 'i' };
    if (query.search) {
      const searchRegex = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { businessName: { $regex: searchRegex, $options: 'i' } },
        { ownerName: { $regex: searchRegex, $options: 'i' } },
        { phone: { $regex: searchRegex, $options: 'i' } },
        { city: { $regex: searchRegex, $options: 'i' } },
      ];
    }

    const [docs, total] = await Promise.all([
      this.providerModel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      this.providerModel.countDocuments(filter).exec(),
    ]);

    return {
      providers: docs.map(doc => this.mapToEntity(doc)),
      total,
    };
  }

  async findNearby(dto: NearbyProviderDto): Promise<(ProviderEntity & { distance: number })[]> {
    const { longitude, latitude, maxDistanceKm = 10, category, limit = 20 } = dto;
    const maxDistanceMeters = maxDistanceKm * 1000;

    const pipeline: any[] = [
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [longitude, latitude] },
          distanceField: 'distance',
          maxDistance: maxDistanceMeters,
          spherical: true,
          query: {
            isActive: true,
            isApproved: true,
            status: ProviderStatus.ONLINE,
          },
        },
      },
      { $limit: limit },
    ];

    if (category) {
      pipeline[0].$geoNear.query.serviceCategories = category;
    }

    const docs = await this.providerModel.aggregate(pipeline).exec();

    return docs.map(doc => {
      const entity = this.mapToEntity(doc as any);
      return {
        ...entity,
        distance: Math.round(((doc.distance || 0) / 1000) * 100) / 100,
      } as any;
    });
  }

  async findById(id: string): Promise<ProviderEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.providerModel.findById(id).populate('services').exec();
    return doc ? this.mapToEntity(doc) : null;
  }

  async findByPhone(phone: string): Promise<ProviderEntity | null> {
    const doc = await this.providerModel.findOne({ phone }).exec();
    return doc ? this.mapToEntity(doc) : null;
  }

  async create(data: Partial<any>): Promise<ProviderEntity> {
    const doc = new this.providerModel(data);
    await doc.save();
    return this.mapToEntity(doc);
  }

  async findTopRated(limit: number = 10): Promise<ProviderEntity[]> {
    const docs = await this.providerModel
      .find({ isActive: true, isApproved: true })
      .sort({ averageRating: -1, totalReviews: -1, totalOrders: -1 })
      .limit(Math.min(Math.max(limit, 1), 50))
      .exec();
    return docs.map(doc => this.mapToEntity(doc));
  }

  async update(id: string, data: Partial<any>): Promise<ProviderEntity> {
    this.ensureObjectId(id);
    const doc = await this.providerModel.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!doc) throw new NotFoundException('Provider not found');
    return this.mapToEntity(doc);
  }

  async updateLocation(id: string, longitude: number, latitude: number): Promise<ProviderEntity> {
    this.ensureObjectId(id);
    const doc = await this.providerModel.findByIdAndUpdate(
      id,
      {
        location: { type: 'Point', coordinates: [longitude, latitude] },
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundException('Provider not found');
    return this.mapToEntity(doc);
  }

  async updateStatus(id: string, status: ProviderStatus): Promise<ProviderEntity> {
    this.ensureObjectId(id);
    const updateData: any = { status };
    if (status === ProviderStatus.ONLINE) {
      updateData.lastOnlineAt = new Date();
    }
    const doc = await this.providerModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    if (!doc) throw new NotFoundException('Provider not found');
    return this.mapToEntity(doc);
  }

  async updateRating(id: string, averageRating: number, totalReviews: number): Promise<void> {
    this.ensureObjectId(id);
    await this.providerModel.findByIdAndUpdate(id, {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: totalReviews,
    }).exec();
  }

  async incrementOrderCount(id: string): Promise<void> {
    this.ensureObjectId(id);
    await this.providerModel.findByIdAndUpdate(id, { $inc: { totalOrders: 1 } }).exec();
  }

  async approve(id: string): Promise<ProviderEntity> {
    this.ensureObjectId(id);
    const doc = await this.providerModel.findByIdAndUpdate(
      id,
      {
        isApproved: true,
        isActive: true,
        registrationStatus: RegistrationStatus.APPROVED,
        rejectionReason: null,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundException('Provider not found');
    return this.mapToEntity(doc);
  }

  async updateRegistrationStatus(id: string, status: RegistrationStatus, reason?: string): Promise<ProviderEntity> {
    this.ensureObjectId(id);
    const update: Record<string, any> = { registrationStatus: status };
    if (status === RegistrationStatus.APPROVED) {
      update.isApproved = true;
      update.isActive = true;
      update.rejectionReason = null;
    }
    if (status === RegistrationStatus.REJECTED) {
      update.isApproved = false;
      update.isActive = false;
      update.status = ProviderStatus.OFFLINE;
      update.rejectionReason = reason;
    }
    const doc = await this.providerModel.findByIdAndUpdate(id, { $set: update }, { new: true }).exec();
    if (!doc) throw new NotFoundException('Provider not found');
    return this.mapToEntity(doc);
  }

  async setActive(id: string, isActive: boolean): Promise<ProviderEntity> {
    this.ensureObjectId(id);
    const update: Record<string, any> = { isActive };
    if (!isActive) update.status = ProviderStatus.OFFLINE;
    const doc = await this.providerModel.findByIdAndUpdate(id, { $set: update }, { new: true }).exec();
    if (!doc) throw new NotFoundException('Provider not found');
    return this.mapToEntity(doc);
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    approved: number;
    pending: number;
    rejected: number;
    online: number;
    busy: number;
    offline: number;
  }> {
    const [total, active, approved, pending, rejected, online, busy, offline] = await Promise.all([
      this.providerModel.countDocuments().exec(),
      this.providerModel.countDocuments({ isActive: true }).exec(),
      this.providerModel.countDocuments({ isApproved: true }).exec(),
      this.providerModel.countDocuments({ registrationStatus: RegistrationStatus.PENDING }).exec(),
      this.providerModel.countDocuments({ registrationStatus: RegistrationStatus.REJECTED }).exec(),
      this.providerModel.countDocuments({ status: ProviderStatus.ONLINE }).exec(),
      this.providerModel.countDocuments({ status: ProviderStatus.BUSY }).exec(),
      this.providerModel.countDocuments({ status: ProviderStatus.OFFLINE }).exec(),
    ]);

    return {
      total,
      active,
      inactive: Math.max(total - active, 0),
      approved,
      pending,
      rejected,
      online,
      busy,
      offline,
    };
  }
}
