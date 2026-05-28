import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Provider, ProviderDocument } from '../../infrastructure/persistence/mongoose/schemas/provider.schema';
import { Order, OrderDocument } from '../../../orders/infrastructure/persistence/mongoose/schemas/order.schema';
import { OrderStatus } from '../../../../core/enums/status.enum';

@Injectable()
export class GetProviderDashboardUseCase {
  constructor(
    @InjectModel(Provider.name) private providerModel: Model<ProviderDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  async getSummary(providerId: string) {
    const objectId = new Types.ObjectId(providerId);

    const [provider, totalOrders, completedOrdersResult, revenueResult] = await Promise.all([
      this.providerModel.findById(providerId),
      this.orderModel.countDocuments({ provider: objectId }),
      this.orderModel.countDocuments({ provider: objectId, status: OrderStatus.COMPLETED }),
      this.orderModel.aggregate([
        { $match: { provider: objectId, status: OrderStatus.COMPLETED } },
        { $group: { _id: null, total: { $sum: '$payableAmount' } } }
      ])
    ]);

    return {
      averageRating: provider?.averageRating || 0,
      totalReviews: provider?.totalReviews || 0,
      totalOrders,
      completedOrders: completedOrdersResult,
      totalRevenue: revenueResult[0]?.total || 0,
      status: provider?.status,
    };
  }

  async getOrdersStats(providerId: string) {
    const objectId = new Types.ObjectId(providerId);
    const stats = await this.orderModel.aggregate([
      { $match: { provider: objectId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    return stats.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});
  }

  async getRevenueStats(providerId: string) {
    const objectId = new Types.ObjectId(providerId);
    return this.orderModel.aggregate([
      { $match: { provider: objectId, status: OrderStatus.COMPLETED } },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          revenue: { $sum: '$payableAmount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);
  }

  async getServicesPerformance(providerId: string) {
    const objectId = new Types.ObjectId(providerId);
    return this.orderModel.aggregate([
      { $match: { provider: objectId, status: OrderStatus.COMPLETED } },
      {
        $group: {
          _id: '$service',
          count: { $sum: 1 },
          revenue: { $sum: '$payableAmount' }
        }
      },
      { $sort: { count: -1 } }
    ]);
  }

  async getCombinedStats(providerId: string) {
    const [
      summary,
      ordersStats,
      revenueStats,
      servicesPerformance
    ] = await Promise.all([
      this.getSummary(providerId),
      this.getOrdersStats(providerId),
      this.getRevenueStats(providerId),
      this.getServicesPerformance(providerId),
    ]);

    return {
      summary,
      ordersStats,
      revenueStats,
      servicesPerformance,
    };
  }
}

