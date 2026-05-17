import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
    return new OrderEntity(
      anyDoc._id.toString(),
      doc.orderNumber,
      doc.user.toString(),
      doc.service.toString(),
      doc.status,
      anyDoc.total ?? doc.payableAmount ?? doc.totalAmount,
      { type: doc.location.type, coordinates: doc.location.coordinates },
      doc.provider?.toString(),
      doc.vehicle?.toString(),
      anyDoc.serviceName ?? doc.metadata?.serviceName,
      anyDoc.servicePrice ?? doc.totalAmount,
      doc.scheduledAt,
      doc.isScheduled,
      doc.paymentStatus,
      doc.paymentMethod,
      doc.userNotes,
      (doc as any).createdAt,
      (doc as any).updatedAt,
    );
  }

  async create(order: Partial<OrderEntity>): Promise<OrderEntity> {
    const created = new this.orderModel({
      ...order,
      user: order.userId,
      service: order.serviceId,
      provider: order.providerId,
      vehicle: order.vehicleId,
    });
    const doc = await created.save();
    return this.mapToEntity(doc);
  }

  async findById(id: string): Promise<OrderEntity | null> {
    const doc = await this.orderModel.findById(id).exec();
    return doc ? this.mapToEntity(doc) : null;
  }

  async findByOrderNumber(orderNumber: string): Promise<OrderEntity | null> {
    const doc = await this.orderModel.findOne({ orderNumber }).exec();
    return doc ? this.mapToEntity(doc) : null;
  }

  async findByCriteria(criteria: any, pagination: { page: number; limit: number }): Promise<{ orders: OrderEntity[]; total: number }> {
    const skip = (pagination.page - 1) * pagination.limit;
    const [docs, total] = await Promise.all([
      this.orderModel.find(criteria)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pagination.limit)
        .exec(),
      this.orderModel.countDocuments(criteria),
    ]);

    return {
      orders: docs.map(doc => this.mapToEntity(doc)),
      total,
    };
  }

  async update(id: string, data: Partial<OrderEntity>): Promise<OrderEntity> {
    const doc = await this.orderModel.findByIdAndUpdate(
      id,
      { $set: data },
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
