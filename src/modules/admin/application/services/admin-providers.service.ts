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
  runtimeStatus?: string;
  city?: string;
  service?: string;
  emergency?: boolean;
  minRating?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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

    if (filters.city && filters.city !== 'all') {
      match.city = filters.city;
    }

    const emergency = this.parseBoolean(filters.emergency);
    if (emergency !== undefined) {
      match.$or = [
        { emergency247: emergency },
        { is_emergency: emergency },
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
