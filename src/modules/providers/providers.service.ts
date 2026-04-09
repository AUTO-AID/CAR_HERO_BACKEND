/**
 * Providers Service
 * Handles provider CRUD and geospatial queries
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Provider, ProviderDocument } from '../../database/schemas/provider.schema';
import { UpdateProviderDto, ProviderQueryDto, NearbyProviderDto } from './dto';
import { getPaginationParams, createPaginationResult } from '../../common/utils/pagination.util';
import { ProviderStatus } from '../../common/enums/status.enum';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectModel(Provider.name) private providerModel: Model<ProviderDocument>,
  ) {}

  /**
   * Find all providers with pagination
   */
  async findAll(query: ProviderQueryDto) {
    const { skip, limit } = getPaginationParams(query);
    const filter: any = {};

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query.isApproved !== undefined) {
      filter.isApproved = query.isApproved;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.category) {
      filter.serviceCategories = query.category;
    }

    if (query.search) {
      filter.$or = [
        { businessName: { $regex: query.search, $options: 'i' } },
        { phone: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [providers, total] = await Promise.all([
      this.providerModel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      this.providerModel.countDocuments(filter).exec(),
    ]);

    return createPaginationResult(providers, total, query.page || 1, limit);
  }

  /**
   * Find nearby providers using geospatial query
   */
  async findNearby(dto: NearbyProviderDto) {
    const { longitude, latitude, maxDistanceKm = 10, category, limit = 20 } = dto;
    const maxDistanceMeters = maxDistanceKm * 1000;

    const pipeline: any[] = [
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
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

    const providers = await this.providerModel.aggregate(pipeline).exec();

    // Convert distance from meters to km
    return providers.map((p) => ({
      ...p,
      distance: Math.round((p.distance / 1000) * 100) / 100,
    }));
  }

  /**
   * Find provider by ID
   */
  async findById(id: string): Promise<ProviderDocument> {
    const provider = await this.providerModel.findById(id).populate('services').exec();

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    return provider;
  }

  /**
   * Update provider
   */
  async update(id: string, dto: UpdateProviderDto): Promise<ProviderDocument> {
    const provider = await this.providerModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    return provider;
  }

  /**
   * Update provider location
   */
  async updateLocation(
    id: string,
    longitude: number,
    latitude: number,
  ): Promise<ProviderDocument> {
    const provider = await this.providerModel
      .findByIdAndUpdate(
        id,
        {
          location: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
        },
        { new: true },
      )
      .exec();

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    return provider;
  }

  /**
   * Update provider status (online/offline)
   */
  async updateStatus(id: string, status: ProviderStatus): Promise<ProviderDocument> {
    const updateData: any = { status };

    if (status === ProviderStatus.ONLINE) {
      updateData.lastOnlineAt = new Date();
    }

    const provider = await this.providerModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    return provider;
  }

  /**
   * Approve provider (admin)
   */
  async approve(id: string): Promise<ProviderDocument> {
    const provider = await this.providerModel
      .findByIdAndUpdate(id, { isApproved: true }, { new: true })
      .exec();

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    return provider;
  }

  /**
   * Update provider rating
   */
  async updateRating(id: string, rating: number): Promise<void> {
    const provider = await this.providerModel.findById(id).exec();

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    // Calculate new average rating
    const newTotalReviews = provider.totalReviews + 1;
    const newAverageRating =
      (provider.averageRating * provider.totalReviews + rating) / newTotalReviews;

    await this.providerModel.findByIdAndUpdate(id, {
      averageRating: Math.round(newAverageRating * 10) / 10,
      totalReviews: newTotalReviews,
    });
  }

  /**
   * Recalculate provider rating from scratch (more robust)
   */
  async recalculateRating(id: string, averageRating: number, totalReviews: number): Promise<void> {
    await this.providerModel.findByIdAndUpdate(id, {
      averageRating,
      totalReviews,
    });
  }
}
