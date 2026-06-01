import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Service, ServiceDocument } from '../../../../modules/services/infrastructure/persistence/mongoose/schemas/service.schema';
import { ServiceCategory } from '../../../../core/enums/status.enum';

export type AdminServiceFilters = {
  search?: string;
  category?: ServiceCategory | 'all';
  isActive?: boolean;
  isEmergency?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

@Injectable()
export class AdminServicesService {
  constructor(
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
  ) {}

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private buildMatch(filters: AdminServiceFilters = {}) {
    const match: any = { isSystemService: true };
    if (filters.category && filters.category !== 'all') match.category = filters.category;
    if (filters.isActive !== undefined) match.isActive = filters.isActive;
    if (filters.isEmergency !== undefined) match.isEmergency = filters.isEmergency;
    if (filters.search?.trim()) {
      const regex = new RegExp(this.escapeRegex(filters.search.trim()), 'i');
      match.$or = [
        { name: regex },
        { nameAr: regex },
        { description: regex },
        { descriptionAr: regex },
        { category: regex },
      ];
    }
    return match;
  }

  private sortStage(sortBy?: string, sortOrder: 'asc' | 'desc' = 'asc') {
    const direction: 1 | -1 = sortOrder === 'desc' ? -1 : 1;
    const allowed: Record<string, string> = {
      sortOrder: 'sortOrder',
      name: 'nameAr',
      price: 'basePrice',
      duration: 'estimatedDuration',
      usage: 'ordersCount',
      revenue: 'ordersRevenue',
      createdAt: 'createdAt',
    };
    return { [allowed[sortBy || 'sortOrder'] || 'sortOrder']: direction, nameAr: 1 as const };
  }

  private servicePipeline(match: any, sort: any, skip = 0, limit = 100) {
    return [
      { $match: match },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'service',
          as: 'orders',
        },
      },
      {
        $addFields: {
          ordersCount: { $size: '$orders' },
          ordersRevenue: { $sum: '$orders.payableAmount' },
          completedOrdersCount: {
            $size: {
              $filter: {
                input: '$orders',
                as: 'order',
                cond: { $eq: ['$$order.status', 'completed'] },
              },
            },
          },
        },
      },
      { $project: { orders: 0, __v: 0 } },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
    ];
  }

  async getAllServices(filters: AdminServiceFilters = {}, page = 1, limit = 100) {
    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 200);
    const skip = (safePage - 1) * safeLimit;
    const match = this.buildMatch(filters);
    const sort = this.sortStage(filters.sortBy, filters.sortOrder);

    const [services, total, facets] = await Promise.all([
      this.serviceModel.aggregate(this.servicePipeline(match, sort, skip, safeLimit)).exec(),
      this.serviceModel.countDocuments(match).exec(),
      this.serviceModel.aggregate([
        { $match: { isSystemService: true } },
        {
          $lookup: {
            from: 'orders',
            localField: '_id',
            foreignField: 'service',
            as: 'orders',
          },
        },
        {
          $facet: {
            categories: [
              { $group: { _id: '$category', count: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } }, emergency: { $sum: { $cond: ['$isEmergency', 1, 0] } } } },
              { $sort: { count: -1 } },
            ],
            status: [
              { $group: { _id: '$isActive', count: { $sum: 1 } } },
            ],
            topUsed: [
              {
                $addFields: {
                  ordersCount: { $size: '$orders' },
                  ordersRevenue: { $sum: '$orders.payableAmount' },
                },
              },
              { $sort: { ordersCount: -1 } },
              { $limit: 10 },
              { $project: { name: '$nameAr', category: 1, ordersCount: 1, ordersRevenue: 1 } },
            ],
            totals: [
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  active: { $sum: { $cond: ['$isActive', 1, 0] } },
                  emergency: { $sum: { $cond: ['$isEmergency', 1, 0] } },
                  avgPrice: { $avg: '$basePrice' },
                  avgDuration: { $avg: '$estimatedDuration' },
                  totalOrders: { $sum: { $size: '$orders' } },
                  totalRevenue: { $sum: { $sum: '$orders.payableAmount' } },
                },
              },
            ],
          },
        },
      ]).exec(),
    ]);

    return {
      services,
      data: services,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        pages: Math.ceil(total / safeLimit),
      },
      facets: facets[0] || {},
    };
  }

  async createService(serviceData: any) {
    const safeData = this.sanitizeServiceData(serviceData);
    const service = new this.serviceModel({
      ...safeData,
      isSystemService: true,
    });
    return service.save();
  }

  private sanitizeServiceData(data: any, partial = false) {
    const allowedCategories = Object.values(ServiceCategory);
    if (data?.category !== undefined && !allowedCategories.includes(data.category)) {
      throw new BadRequestException(`Invalid service category. Allowed values: ${allowedCategories.join(', ')}`);
    }

    const sanitized: any = {
      name: data.name || data.nameAr,
      nameAr: data.nameAr || data.name,
      description: data.description,
      descriptionAr: data.descriptionAr,
      category: data.category,
      basePrice: data.basePrice === undefined ? undefined : Number(data.basePrice),
      discountedPrice: data.discountedPrice === undefined ? undefined : Number(data.discountedPrice || 0),
      estimatedDuration: data.estimatedDuration === undefined ? undefined : Number(data.estimatedDuration),
      icon: data.icon,
      image: data.image,
      isEmergency: data.isEmergency === undefined ? undefined : Boolean(data.isEmergency),
      isActive: data.isActive === undefined ? undefined : data.isActive !== false,
      isSystemService: true,
      sortOrder: data.sortOrder === undefined ? undefined : Number(data.sortOrder || 0),
      options: data.options === undefined ? undefined : (Array.isArray(data.options) ? data.options : []),
      metadata: typeof data.metadata === 'object' && data.metadata ? data.metadata : {},
    };

    if (partial) {
      Object.keys(sanitized).forEach((key) => sanitized[key] === undefined && delete sanitized[key]);
    }

    return sanitized;
  }

  async updateService(id: string, updateData: any) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Service not found');
    }
    const safeUpdate = this.sanitizeServiceData(updateData, true);

    const service = await this.serviceModel.findByIdAndUpdate(
      id,
      { $set: safeUpdate },
      { new: true },
    ).exec();

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return {
      message: 'Service updated successfully',
      service,
    };
  }

  async deleteService(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Service not found');
    }
    const service = await this.serviceModel.findByIdAndUpdate(
      id,
      { $set: { isActive: false, 'metadata.deletedAt': new Date() } },
      { new: true },
    ).exec();
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return { message: 'Service deactivated successfully', service };
  }
}
