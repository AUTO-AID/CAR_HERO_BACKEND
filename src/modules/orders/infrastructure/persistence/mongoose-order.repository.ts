import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../domain/entities/order.entity';
import { Order, OrderDocument } from './mongoose/schemas/order.schema';
import { OrderStatus, PaymentStatus } from '../../../../core/enums/status.enum';

@Injectable()
export class MongooseOrderRepository implements IOrderRepository {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
  ) {}

  private mapToEntity(doc: OrderDocument): OrderEntity {
    const anyDoc = doc as any;
    const serviceDetails = anyDoc.serviceDetails || anyDoc.service;
    const userDetails = anyDoc.userDetails || anyDoc.user;
    const providerDetails = anyDoc.providerDetails || anyDoc.provider;
    const vehicleDetails = anyDoc.vehicleDetails || anyDoc.vehicle;
    const servicePrice =
      anyDoc.servicePrice ??
      anyDoc.totalAmount ??
      anyDoc.payableAmount ??
      anyDoc.total ??
      serviceDetails?.discountedPrice ??
      serviceDetails?.basePrice ??
      0;
    const recordedTotal = anyDoc.total ?? doc.payableAmount ?? doc.totalAmount ?? 0;
    const total = recordedTotal > 0 ? recordedTotal : servicePrice;

    const entity = new OrderEntity(
      anyDoc._id.toString(),
      doc.orderNumber,
      anyDoc.user?._id?.toString?.() ?? doc.user.toString(),
      anyDoc.service?._id?.toString?.() ?? doc.service.toString(),
      doc.status,
      total,
      { type: doc.location.type, coordinates: doc.location.coordinates },
      anyDoc.provider?._id?.toString?.() ?? doc.provider?.toString(),
      anyDoc.vehicle?._id?.toString?.() ?? doc.vehicle?.toString(),
      anyDoc.serviceName ?? doc.metadata?.serviceName ?? serviceDetails?.nameAr ?? serviceDetails?.name,
      servicePrice,
      doc.scheduledAt,
      doc.isScheduled,
      doc.paymentStatus,
      doc.paymentMethod,
      doc.userNotes,
      (doc as any).createdAt,
      (doc as any).updatedAt,
    );

    (entity as any).user = {
      fullName: userDetails?.fullName,
      phoneNumber: userDetails?.phoneNumber,
    };
    (entity as any).service = {
      name: serviceDetails?.nameAr ?? serviceDetails?.name ?? entity.serviceName,
    };
    (entity as any).provider = providerDetails?._id
      ? {
          businessName: providerDetails.businessName,
          ownerName: providerDetails.ownerName,
          phone: providerDetails.phone,
          city: providerDetails.city,
        }
      : undefined;
    (entity as any).vehicle = vehicleDetails?._id
      ? {
          brand: vehicleDetails.brand,
          model: vehicleDetails.model,
          plateNumber: vehicleDetails.plateNumber,
          color: vehicleDetails.color,
          type: vehicleDetails.type,
        }
      : undefined;
    (entity as any).address = anyDoc.address;
    (entity as any).payableAmount = anyDoc.payableAmount ?? total;
    (entity as any).totalAmount = anyDoc.totalAmount ?? total;
    (entity as any).discountAmount = anyDoc.discountAmount ?? 0;
    (entity as any).acceptedAt = anyDoc.acceptedAt;
    (entity as any).startedAt = anyDoc.startedAt;
    (entity as any).completedAt = anyDoc.completedAt;
    (entity as any).cancelledAt = anyDoc.cancelledAt;
    (entity as any).cancellationReason = anyDoc.cancellationReason;
    (entity as any).cancelledBy = anyDoc.cancelledBy;
    (entity as any).rating = anyDoc.rating;

    return entity;
  }

  async create(order: Partial<OrderEntity>): Promise<OrderEntity> {
    const created = new this.orderModel({
      ...order,
      user: order.userId,
      service: order.serviceId,
      provider: order.providerId,
      vehicle: order.vehicleId,
      totalAmount: order.total,
      payableAmount: order.total,
      location: order.userLocation,
    });
    const doc = await created.save();
    return this.mapToEntity(doc);
  }

  async findById(id: string): Promise<OrderEntity | null> {
    const doc = await this.orderModel.findById(id)
      .populate('user', 'fullName phoneNumber')
      .populate('provider', 'businessName ownerName phone city')
      .populate('service', 'name nameAr basePrice discountedPrice')
      .populate('vehicle', 'brand model plateNumber color type')
      .exec();
    return doc ? this.mapToEntity(doc) : null;
  }

  async findByOrderNumber(orderNumber: string): Promise<OrderEntity | null> {
    const doc = await this.orderModel.findOne({ orderNumber }).exec();
    return doc ? this.mapToEntity(doc) : null;
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private toDate(value: any, endOfDay = false) {
    if (!value) return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return undefined;
    if (endOfDay) date.setHours(23, 59, 59, 999);
    return date;
  }

  private normalizeObjectIdMatch(match: any) {
    ['user', 'provider', 'service', 'vehicle'].forEach((field) => {
      const value = match[field];
      if (typeof value === 'string' && Types.ObjectId.isValid(value)) {
        match[field] = new Types.ObjectId(value);
      }
    });
    return match;
  }

  private sortStage(sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc') {
    const direction: 1 | -1 = sortOrder === 'asc' ? 1 : -1;
    const allowed: Record<string, string> = {
      createdAt: 'createdAt',
      scheduledAt: 'scheduledAt',
      amount: 'payableAmount',
      status: 'status',
      paymentStatus: 'paymentStatus',
      orderNumber: 'orderNumber',
    };
    return { [allowed[sortBy || 'createdAt'] || 'createdAt']: direction, _id: -1 as const };
  }

  private lookupStages() {
    return [
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userDetails' } },
      { $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'providers', localField: 'provider', foreignField: '_id', as: 'providerDetails' } },
      { $unwind: { path: '$providerDetails', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'services', localField: 'service', foreignField: '_id', as: 'serviceDetails' } },
      { $unwind: { path: '$serviceDetails', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'vehicles', localField: 'vehicle', foreignField: '_id', as: 'vehicleDetails' } },
      { $unwind: { path: '$vehicleDetails', preserveNullAndEmptyArrays: true } },
    ];
  }

  async findByCriteria(criteria: any, pagination: { page: number; limit: number }): Promise<{ orders: OrderEntity[]; total: number; facets?: any }> {
    const safePage = Math.max(Number(pagination.page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(pagination.limit) || 10, 1), 100);
    const skip = (safePage - 1) * safeLimit;
    const {
      __search,
      __statuses,
      __paymentStatus,
      __paymentMethod,
      __isScheduled,
      __dateFrom,
      __dateTo,
      __minAmount,
      __maxAmount,
      __sortBy,
      __sortOrder,
      ...baseCriteria
    } = criteria || {};

    const match: any = this.normalizeObjectIdMatch({ ...baseCriteria });
    if (__statuses) {
      const statuses = String(__statuses).split(',').map(status => status.trim()).filter(Boolean);
      if (statuses.length) match.status = { $in: statuses };
    }
    if (__paymentStatus) match.paymentStatus = __paymentStatus;
    if (__paymentMethod) match.paymentMethod = __paymentMethod;
    if (__isScheduled !== undefined) match.isScheduled = __isScheduled === true || __isScheduled === 'true';

    const from = this.toDate(__dateFrom);
    const to = this.toDate(__dateTo, true);
    if (from || to) match.createdAt = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
    if (__minAmount !== undefined || __maxAmount !== undefined) {
      match.payableAmount = {
        ...(__minAmount !== undefined && __minAmount !== '' ? { $gte: Number(__minAmount) } : {}),
        ...(__maxAmount !== undefined && __maxAmount !== '' ? { $lte: Number(__maxAmount) } : {}),
      };
    }

    const searchStage = __search?.trim()
      ? [{
          $match: {
            $or: [
              { orderNumber: new RegExp(this.escapeRegex(__search.trim()), 'i') },
              { address: new RegExp(this.escapeRegex(__search.trim()), 'i') },
              { userNotes: new RegExp(this.escapeRegex(__search.trim()), 'i') },
              { 'userDetails.fullName': new RegExp(this.escapeRegex(__search.trim()), 'i') },
              { 'userDetails.phoneNumber': new RegExp(this.escapeRegex(__search.trim()), 'i') },
              { 'providerDetails.businessName': new RegExp(this.escapeRegex(__search.trim()), 'i') },
              { 'providerDetails.phone': new RegExp(this.escapeRegex(__search.trim()), 'i') },
              { 'serviceDetails.name': new RegExp(this.escapeRegex(__search.trim()), 'i') },
              { 'serviceDetails.nameAr': new RegExp(this.escapeRegex(__search.trim()), 'i') },
            ],
          },
        }]
      : [];

    const pipeline: any[] = [
      { $match: match },
      ...this.lookupStages(),
      ...searchStage,
    ];

    const [result] = await this.orderModel.aggregate([
      ...pipeline,
      {
        $facet: {
          rows: [
            { $sort: this.sortStage(__sortBy, __sortOrder) },
            { $skip: skip },
            { $limit: safeLimit },
          ],
          total: [{ $count: 'count' }],
          statusCounts: [{ $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$payableAmount' } } }],
          paymentCounts: [{ $group: { _id: '$paymentStatus', count: { $sum: 1 } } }],
          paymentMethods: [{ $group: { _id: '$paymentMethod', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
          services: [
            { $group: { _id: { $ifNull: ['$serviceDetails.nameAr', '$serviceDetails.name'] }, count: { $sum: 1 } } },
            { $match: { _id: { $nin: [null, ''] } } },
            { $sort: { count: -1 } },
            { $limit: 20 },
          ],
          totals: [
            {
              $group: {
                _id: null,
                revenue: { $sum: '$payableAmount' },
                avgAmount: { $avg: '$payableAmount' },
                scheduled: { $sum: { $cond: ['$isScheduled', 1, 0] } },
              },
            },
          ],
        },
      },
    ]).exec();

    const docs = result?.rows || [];
    const total = result?.total?.[0]?.count || 0;

    return {
      orders: docs.map(doc => this.mapToEntity(doc)),
      total,
      facets: {
        statusCounts: result?.statusCounts || [],
        paymentCounts: result?.paymentCounts || [],
        paymentMethods: result?.paymentMethods || [],
        services: result?.services || [],
        totals: result?.totals?.[0] || { revenue: 0, avgAmount: 0, scheduled: 0 },
      },
    };
  }

  async update(id: string, data: Partial<OrderEntity>): Promise<OrderEntity> {
    const updateData: any = { ...data };
    if (data.total !== undefined) {
      updateData.totalAmount = data.total;
      updateData.payableAmount = data.total;
    }
    if (data.userLocation !== undefined) {
      updateData.location = data.userLocation;
    }
    const doc = await this.orderModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).exec();
    if (!doc) throw new Error('Order not found');
    return this.mapToEntity(doc);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.orderModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async search(query: string): Promise<OrderEntity[]> {
    const searchRegex = new RegExp(query, 'i');
    
    // Using aggregation to search across joined collections (User and Provider names)
    const docs = await this.orderModel.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $lookup: {
          from: 'providers',
          localField: 'provider',
          foreignField: '_id',
          as: 'providerDetails'
        }
      },
      {
        $match: {
          $or: [
            { orderNumber: searchRegex },
            { serviceName: searchRegex },
            { 'userDetails.fullName': searchRegex },
            { 'providerDetails.businessName': searchRegex }
          ]
        }
      },
      { $limit: 50 },
      { $sort: { createdAt: -1 } }
    ]).exec();

    return docs.map(doc => this.mapToEntity({ ...doc, _id: doc._id }));
  }

  async getStats(period: string): Promise<any> {
    const stats = await this.orderModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$total' }
        }
      }
    ]).exec();

    const result = stats.reduce((acc, curr) => {
      acc[curr._id] = { count: curr.count, revenue: curr.totalRevenue };
      return acc;
    }, {});

    return result;
  }

  async findByDateRange(from: Date, to: Date, status?: string): Promise<OrderEntity[]> {
    const query: any = {
      createdAt: { $gte: from, $lte: to }
    };
    if (status) query.status = status;

    const docs = await this.orderModel.find(query).sort({ createdAt: 1 }).exec();
    return docs.map(doc => this.mapToEntity(doc));
  }

  async addReview(id: string, rating: number, comment?: string): Promise<OrderEntity> {
    const doc = await this.orderModel.findByIdAndUpdate(
      id,
      { 
        $set: { 
          rating, 
          'metadata.reviewComment': comment // Storing comment in metadata or dedicated field if exists
        } 
      },
      { new: true }
    ).exec();
    if (!doc) throw new Error('Order not found');
    return this.mapToEntity(doc);
  }

  async updateProviderLocation(id: string, coordinates: number[]): Promise<OrderEntity> {
    const doc = await this.orderModel.findByIdAndUpdate(
      id,
      { 
        $set: { 
          providerLocation: {
            type: 'Point',
            coordinates: coordinates
          }
        } 
      },
      { new: true }
    ).exec();
    if (!doc) throw new Error('Order not found');
    return this.mapToEntity(doc);
  }

  async updatePaymentDetails(id: string, paymentId: string, paymentMethod?: string): Promise<OrderEntity> {
    const doc = await this.orderModel.findByIdAndUpdate(
      id,
      { 
        $set: { 
          paymentId,
          paymentMethod: paymentMethod || 'online',
          paymentStatus: PaymentStatus.COMPLETED
        } 
      },
      { new: true }
    ).exec();
    if (!doc) throw new Error('Order not found');
    return this.mapToEntity(doc);
  }

  async cancelOrder(id: string, reason: string, cancelledBy?: string): Promise<OrderEntity> {
    const doc = await this.orderModel.findByIdAndUpdate(
      id,
      { 
        $set: { 
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: reason,
          cancelledBy: cancelledBy || 'user'
        } 
      },
      { new: true }
    ).exec();
    if (!doc) throw new Error('Order not found');
    return this.mapToEntity(doc);
  }

  async findExpiredPendingOrders(hours: number): Promise<OrderEntity[]> {
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() - hours);

    const docs = await this.orderModel.find({
      status: OrderStatus.PENDING,
      createdAt: { $lt: expirationDate }
    }).exec();

    return docs.map(doc => this.mapToEntity(doc));
  }
}
