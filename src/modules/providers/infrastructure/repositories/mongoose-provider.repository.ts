import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IProviderRepository } from '../../domain/repositories/provider.repository.interface';
import { ProviderEntity } from '../../domain/entities/provider.entity';
import { Provider, ProviderDocument } from '../persistence/mongoose/schemas/provider.schema';
import { NearbyProviderDto, ProviderQueryDto } from '../../application/dtos/provider.dto';
import { getPaginationParams } from '../../../../core/utils/pagination.util';
import { ProviderStatus } from '../../../../core/enums/status.enum';

@Injectable()
export class MongooseProviderRepository implements IProviderRepository {
  constructor(
    @InjectModel(Provider.name) private readonly providerModel: Model<ProviderDocument>,
  ) {}

  private mapToEntity(doc: ProviderDocument): ProviderEntity {
    return new ProviderEntity(
      doc._id.toString(),
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
      doc.services.map(id => id.toString()),
      doc.workingHours,
      doc.walletBalance,
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
    if (query.status) filter.status = query.status;
    if (query.category) filter.serviceCategories = query.category;
    if (query.search) {
      filter.$or = [
        { businessName: { $regex: query.search, $options: 'i' } },
        { phone: { $regex: query.search, $options: 'i' } },
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
    const doc = await this.providerModel.findById(id).populate('services').exec();
    return doc ? this.mapToEntity(doc) : null;
  }

  async findByPhone(phone: string): Promise<ProviderEntity | null> {
    const doc = await this.providerModel.findOne({ phone }).exec();
    return doc ? this.mapToEntity(doc) : null;
  }

  async update(id: string, data: Partial<any>): Promise<ProviderEntity> {
    const doc = await this.providerModel.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!doc) throw new NotFoundException('Provider not found');
    return this.mapToEntity(doc);
  }

  async updateLocation(id: string, longitude: number, latitude: number): Promise<ProviderEntity> {
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
    const updateData: any = { status };
    if (status === ProviderStatus.ONLINE) {
      updateData.lastOnlineAt = new Date();
    }
    const doc = await this.providerModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    if (!doc) throw new NotFoundException('Provider not found');
    return this.mapToEntity(doc);
  }

  async updateRating(id: string, averageRating: number, totalReviews: number): Promise<void> {
    await this.providerModel.findByIdAndUpdate(id, {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: totalReviews,
    }).exec();
  }

  async incrementOrderCount(id: string): Promise<void> {
    await this.providerModel.findByIdAndUpdate(id, { $inc: { totalOrders: 1 } }).exec();
  }

  async approve(id: string): Promise<ProviderEntity> {
    const doc = await this.providerModel.findByIdAndUpdate(id, { isApproved: true }, { new: true }).exec();
    if (!doc) throw new NotFoundException('Provider not found');
    return this.mapToEntity(doc);
  }
}
