import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Provider, ProviderDocument } from '../../../../modules/providers/infrastructure/persistence/mongoose/schemas/provider.schema';
import { User, UserDocument } from '../../../users/infrastructure/persistence/mongoose/schemas/user.schema';
import { NotificationsService } from '../../../notifications/application/services/notifications.service';
import { RegistrationStatus, NotificationType, OrderStatus } from '../../../../core/enums/status.enum';

export type ProviderListFilters = {
  status?: RegistrationStatus | 'all';
  search?: string;
  isActive?: boolean;
  location?: string;
  governorate?: string;
  runtimeStatus?: string;
  city?: string;
  service?: string;
  emergency?: boolean;
  minRating?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

const SERVICE_AREA_BOUNDS = {
  minLng: 32,
  maxLng: 43.5,
  minLat: 31,
  maxLat: 38.5,
};

@Injectable()
export class AdminProvidersService {
  constructor(
    @InjectModel(Provider.name) private providerModel: Model<ProviderDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private notificationsService: NotificationsService,
  ) {}

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private parseBoolean(value: any): boolean | undefined {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return undefined;
  }

  private buildProviderMatch(filters: ProviderListFilters = {}) {
    const match: any = {};
    const status = filters.status;
    if (status && status !== 'all') {
      match.registrationStatus = status;
    }

    const isActive = this.parseBoolean(filters.isActive);
    if (isActive !== undefined) {
      match.isActive = isActive;
    }

    if (filters.runtimeStatus && filters.runtimeStatus !== 'all') {
      match.status = filters.runtimeStatus;
    }

    const location = filters.location && filters.location !== 'all' ? filters.location : undefined;
    if (location) {
      match.$and = [
        ...(match.$and || []),
        {
          $or: [
            { governorate: location },
            { city: location },
          ],
        },
      ];
    } else {
      if (filters.city && filters.city !== 'all') {
        match.city = filters.city;
      }

      if (filters.governorate && filters.governorate !== 'all') {
        match.governorate = filters.governorate;
      }
    }

    const emergency = this.parseBoolean(filters.emergency);
    if (emergency === true) {
      match.$or = [
        { emergency247: true },
        { is_emergency: true },
      ];
    } else if (emergency === false) {
      match.$and = [
        ...(match.$and || []),
        { emergency247: { $ne: true } },
        { is_emergency: { $ne: true } },
      ];
    }

    if (filters.minRating !== undefined && !Number.isNaN(Number(filters.minRating))) {
      match.averageRating = { $gte: Number(filters.minRating) };
    }

    if (filters.service && filters.service !== 'all') {
      const regex = new RegExp(this.escapeRegex(filters.service), 'i');
      match.$and = [
        ...(match.$and || []),
        {
          $or: [
            { category: regex },
            { serviceCategories: regex },
            { requestedServices: regex },
            { 'services_list.name': regex },
            { 'services_list.service_id': regex },
          ],
        },
      ];
    }

    if (filters.search?.trim()) {
      const regex = new RegExp(this.escapeRegex(filters.search.trim()), 'i');
      match.$and = [
        ...(match.$and || []),
        {
          $or: [
            { businessName: regex },
            { ownerName: regex },
            { phone: regex },
            { email: regex },
            { city: regex },
            { governorate: regex },
            { address: regex },
            { 'services_list.name': regex },
          ],
        },
      ];
    }

    return match;
  }

  private sortStage(sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc') {
    const direction: 1 | -1 = sortOrder === 'asc' ? 1 : -1;
    const allowed: Record<string, string> = {
      createdAt: 'createdAt',
      businessName: 'businessName',
      rating: 'computedAverageRating',
      orders: 'actualOrdersCount',
      completedOrders: 'completedOrdersCount',
      revenue: 'completedRevenue',
      lastOnlineAt: 'lastOnlineAt',
      city: 'city',
    };
    return { [allowed[sortBy || 'createdAt'] || 'createdAt']: direction, _id: -1 as const };
  }

  private enrichmentPipeline() {
    return [
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'provider',
          as: 'orders',
        },
      },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'provider',
          as: 'reviews',
        },
      },
      {
        $addFields: {
          actualOrdersCount: { $size: '$orders' },
          completedOrdersCount: {
            $size: {
              $filter: {
                input: '$orders',
                as: 'order',
                cond: { $eq: ['$$order.status', OrderStatus.COMPLETED] },
              },
            },
          },
          completedRevenue: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$orders',
                    as: 'order',
                    cond: { $eq: ['$$order.status', OrderStatus.COMPLETED] },
                  },
                },
                as: 'order',
                in: { $ifNull: ['$$order.payableAmount', '$$order.totalAmount'] },
              },
            },
          },
          computedAverageRating: {
            $cond: [
              { $gt: [{ $size: '$reviews' }, 0] },
              { $round: [{ $avg: '$reviews.rating' }, 2] },
              { $ifNull: ['$averageRating', 0] },
            ],
          },
          computedReviewsCount: {
            $cond: [
              { $gt: [{ $size: '$reviews' }, 0] },
              { $size: '$reviews' },
              { $ifNull: ['$totalReviews', 0] },
            ],
          },
          servicesCount: {
            $add: [
              { $size: { $ifNull: ['$serviceCategories', []] } },
              { $size: { $ifNull: ['$requestedServices', []] } },
              { $size: { $ifNull: ['$services_list', []] } },
            ],
          },
        },
      },
      {
        $project: {
          orders: 0,
          reviews: 0,
          otp: 0,
          otpExpiry: 0,
          refreshToken: 0,
          __v: 0,
        },
      },
    ];
  }

  async getAllProviders(filters: ProviderListFilters = {}, page = 1, limit = 10) {
    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const skip = (safePage - 1) * safeLimit;
    const match = this.buildProviderMatch(filters);
    const sort = this.sortStage(filters.sortBy, filters.sortOrder);

    const [providers, total, facets] = await Promise.all([
      this.providerModel.aggregate([
        { $match: match },
        ...this.enrichmentPipeline(),
        { $sort: sort },
        { $skip: skip },
        { $limit: safeLimit },
      ]).exec(),
      this.providerModel.countDocuments(match),
      this.providerModel.aggregate([
        {
          $facet: {
            statuses: [{ $group: { _id: '$registrationStatus', count: { $sum: 1 } } }],
            cities: [
              { $match: { city: { $nin: [null, ''] } } },
              { $group: { _id: '$city', count: { $sum: 1 } } },
              { $sort: { count: -1, _id: 1 } },
              { $limit: 50 },
            ],
            services: [
              { $unwind: { path: '$services_list', preserveNullAndEmptyArrays: true } },
              { $match: { 'services_list.name': { $nin: [null, ''] } } },
              { $group: { _id: '$services_list.name', count: { $sum: 1 } } },
              { $sort: { count: -1, _id: 1 } },
              { $limit: 50 },
            ],
          },
        },
      ]).exec(),
    ]);

    return {
      providers,
      data: providers,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        pages: Math.ceil(total / safeLimit),
      },
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        pages: Math.ceil(total / safeLimit),
      },
      facets: facets[0] || { statuses: [], cities: [], services: [] },
    };
  }

  async getProviderById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Provider not found');
    }
    const [provider] = await this.providerModel.aggregate([
      { $match: { _id: new Types.ObjectId(id) } },
      ...this.enrichmentPipeline(),
    ]).exec();
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }
    return provider;
  }

  async getProvidersMap(filters: ProviderListFilters = {}) {
    const andMatch = (...parts: any[]) => {
      const meaningfulParts = parts.filter((part) => part && Object.keys(part).length > 0);
      if (meaningfulParts.length === 0) return {};
      if (meaningfulParts.length === 1) return meaningfulParts[0];
      return { $and: meaningfulParts };
    };

    const missingLocationMatch = {
      isApproved: true,
      isActive: { $ne: false },
      $or: [
        { location: { $exists: false } },
        { location: null },
        { 'location.coordinates': { $exists: false } },
        { 'location.coordinates': { $size: 0 } },
        { 'location.type': { $ne: 'Point' } },
        { 'location.coordinates.0': { $not: { $type: 'number' } } },
        { 'location.coordinates.1': { $not: { $type: 'number' } } },
        { 'location.coordinates.0': { $lt: SERVICE_AREA_BOUNDS.minLng } },
        { 'location.coordinates.0': { $gt: SERVICE_AREA_BOUNDS.maxLng } },
        { 'location.coordinates.1': { $lt: SERVICE_AREA_BOUNDS.minLat } },
        { 'location.coordinates.1': { $gt: SERVICE_AREA_BOUNDS.maxLat } },
      ],
    };

    const baseMapMatch = {
      isApproved: true,
      isActive: { $ne: false },
      'location.type': 'Point',
      'location.coordinates.0': { $type: 'number', $gte: SERVICE_AREA_BOUNDS.minLng, $lte: SERVICE_AREA_BOUNDS.maxLng },
      'location.coordinates.1': { $type: 'number', $gte: SERVICE_AREA_BOUNDS.minLat, $lte: SERVICE_AREA_BOUNDS.maxLat },
    };
    const filteredMatch = andMatch(this.buildProviderMatch(filters), baseMapMatch);

    const mapPipeline: any[] = [
      { $match: filteredMatch },
      {
        $lookup: {
          from: 'provider_metrics',
          localField: '_id',
          foreignField: 'provider',
          as: 'metrics',
        },
      },
      {
        $addFields: {
          metric: { $ifNull: [{ $arrayElemAt: ['$metrics', 0] }, {}] },
        },
      },
      {
        $project: {
          _id: 1,
          businessName: 1,
          ownerName: 1,
          phone: 1,
          email: 1,
          city: 1,
          governorate: 1,
          address: 1,
          status: 1,
          accountStatus: 1,
          registrationStatus: 1,
          isActive: 1,
          isApproved: 1,
          emergency247: 1,
          is_emergency: 1,
          serviceCategories: 1,
          requestedServices: 1,
          services_list: 1,
          location: 1,
          lastOnlineAt: 1,
          createdAt: 1,
          totalOrders: { $ifNull: ['$metric.totalOrders', { $ifNull: ['$totalOrders', 0] }] },
          completedOrders: { $ifNull: ['$metric.completedOrders', 0] },
          activeOrders: { $ifNull: ['$activeOrders', 0] },
          completedRevenue: { $ifNull: ['$metric.totalRevenue', { $ifNull: ['$completedRevenue', 0] }] },
          completionRate: { $ifNull: ['$metric.completionRate', 0] },
          cancellationRate: { $ifNull: ['$metric.cancellationRate', 0] },
          averageResponseTime: { $ifNull: ['$metric.averageResponseTime', 0] },
          last30DaysOrders: { $ifNull: ['$metric.last30DaysPerformance.totalOrders', 0] },
          averageRating: {
            $round: [
              { $ifNull: ['$metric.averageRating', { $ifNull: ['$averageRating', 0] }] },
              2,
            ],
          },
          totalReviews: { $ifNull: ['$metric.totalReviews', { $ifNull: ['$totalReviews', 0] }] },
        },
      },
      { $sort: { isApproved: -1, isActive: -1, totalOrders: -1, averageRating: -1, businessName: 1 } },
    ];

    const facetMatchFor = (excludedKey?: keyof ProviderListFilters) => {
      const facetFilters = { ...filters };
      if (excludedKey) delete facetFilters[excludedKey];
      return andMatch(this.buildProviderMatch(facetFilters), baseMapMatch);
    };

    const [providers, missingLocation, facets] = await Promise.all([
      this.providerModel.aggregate(mapPipeline).exec(),
      this.providerModel.countDocuments(andMatch(this.buildProviderMatch(filters), missingLocationMatch)),
      this.providerModel.aggregate([
        {
          $facet: {
            locations: [
              { $match: facetMatchFor('location') },
              {
                $project: {
                  locationLabels: {
                    $setUnion: [
                      {
                        $cond: [
                          { $and: [{ $ne: ['$governorate', null] }, { $ne: ['$governorate', ''] }] },
                          ['$governorate'],
                          [],
                        ],
                      },
                      {
                        $cond: [
                          { $and: [{ $ne: ['$city', null] }, { $ne: ['$city', ''] }] },
                          ['$city'],
                          [],
                        ],
                      },
                    ],
                  },
                },
              },
              { $unwind: '$locationLabels' },
              { $group: { _id: '$locationLabels', count: { $sum: 1 } } },
              { $sort: { count: -1, _id: 1 } },
              { $limit: 120 },
            ],
            governorates: [
              { $match: facetMatchFor(filters.location ? 'location' : 'governorate') },
              { $match: { governorate: { $nin: [null, ''] } } },
              { $group: { _id: '$governorate', count: { $sum: 1 } } },
              { $sort: { count: -1, _id: 1 } },
            ],
            cities: [
              { $match: facetMatchFor(filters.location ? 'location' : 'city') },
              { $match: { city: { $nin: [null, ''] } } },
              { $group: { _id: '$city', count: { $sum: 1 } } },
              { $sort: { count: -1, _id: 1 } },
              { $limit: 80 },
            ],
            services: [
              { $match: facetMatchFor('service') },
              {
                $project: {
                  serviceLabels: {
                    $setUnion: [
                      { $ifNull: ['$serviceCategories', []] },
                      { $ifNull: ['$requestedServices', []] },
                      {
                        $map: {
                          input: { $ifNull: ['$services_list', []] },
                          as: 'service',
                          in: { $ifNull: ['$$service.name', '$$service.service_id'] },
                        },
                      },
                    ],
                  },
                },
              },
              { $unwind: '$serviceLabels' },
              { $match: { serviceLabels: { $nin: [null, ''] } } },
              { $group: { _id: '$serviceLabels', count: { $sum: 1 } } },
              { $sort: { count: -1, _id: 1 } },
              { $limit: 80 },
            ],
          },
        },
      ]).exec(),
    ]);

    const summary = providers.reduce(
      (acc: any, provider: any) => {
        acc.total += 1;
        if (provider.isActive !== false && provider.isApproved === true) acc.activeApproved += 1;
        if (provider.status === 'online') acc.online += 1;
        if (provider.status === 'busy') acc.busy += 1;
        if (provider.emergency247 || provider.is_emergency) acc.emergency += 1;
        acc.totalOrders += Number(provider.totalOrders || 0);
        acc.completedRevenue += Number(provider.completedRevenue || 0);
        return acc;
      },
      {
        total: 0,
        activeApproved: 0,
        online: 0,
        busy: 0,
        emergency: 0,
        totalOrders: 0,
        completedRevenue: 0,
        missingLocation,
      },
    );

    return {
      providers,
      data: providers,
      summary,
      facets: facets[0] || { locations: [], governorates: [], cities: [], services: [] },
    };
  }

  async approveProvider(id: string) {
    const provider = await this.providerModel.findByIdAndUpdate(
      id,
      { 
        $set: { 
          registrationStatus: RegistrationStatus.APPROVED,
          accountStatus: 'active',
          isApproved: true,
          isActive: true,
          isVerified: true
        } 
      },
      { new: true },
    ).exec();

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const user = await this.userModel.findOneAndUpdate(
      { phoneNumber: provider.phone },
      { $set: { isActive: true } },
      { new: true }
    );

    if (user) {
      await this.notificationsService.createNotification({
        recipientId: user._id.toString(),
        recipientType: 'provider',
        title: 'Registration Approved! 🎉',
        body: 'Welcome to CarHero! Your account is now active and you can start accepting orders.',
        type: NotificationType.INFO,
        data: {
          event: 'provider.registration.approved',
          providerId: provider._id.toString(),
        },
      });
    }

    return {
      message: 'Provider approved and activated successfully',
      provider,
    };
  }

  async rejectProvider(id: string, reason: string) {
    const provider = await this.providerModel.findByIdAndUpdate(
      id,
      { 
        $set: { 
          registrationStatus: RegistrationStatus.REJECTED,
          accountStatus: 'suspended',
          isApproved: false,
          isActive: false,
          rejectionReason: reason
        } 
      },
      { new: true },
    ).exec();

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const user = await this.userModel.findOne({ phoneNumber: provider.phone });
    if (user) {
      await this.userModel.updateOne(
        { _id: user._id },
        { $set: { isActive: false } }
      );

      await this.notificationsService.createNotification({
        recipientId: user._id.toString(),
        recipientType: 'provider',
        title: 'Registration Update 🛑',
        body: `Unfortunately, your registration was not approved. Reason: ${reason}`,
        type: NotificationType.ALERT,
        data: {
          event: 'provider.registration.rejected',
          providerId: provider._id.toString(),
          reason,
        },
      });
    }

    return {
      message: 'Provider registration rejected',
      provider,
    };
  }

  async updateProvider(id: string, updateData: any) {
    const allowedFields = [
      'businessName',
      'ownerName',
      'phone',
      'email',
      'city',
      'governorate',
      'address',
      'description',
      'status',
      'accountStatus',
      'registrationStatus',
      'isActive',
      'isApproved',
      'isPhoneVerified',
      'emergency247',
      'is_emergency',
      'serviceRadiusKm',
      'experienceYears',
      'techCount',
      'commissionRate',
    ];
    const safeUpdate = Object.fromEntries(
      Object.entries(updateData || {}).filter(([key]) => allowedFields.includes(key)),
    );

    const provider = await this.providerModel.findByIdAndUpdate(
      id,
      { $set: safeUpdate },
      { new: true },
    ).exec();

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    return {
      message: 'Provider data updated successfully',
      provider,
    };
  }
}
