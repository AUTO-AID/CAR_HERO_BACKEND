import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProviderMetrics, ProviderMetricsDocument } from '../../infrastructure/schemas/provider-metrics.schema';
import { Order, OrderDocument } from '../../../orders/infrastructure/persistence/mongoose/schemas/order.schema';
import { Review, ReviewDocument } from '../../../reviews/infrastructure/persistence/mongoose/schemas/review.schema';
import { Service, ServiceDocument } from '../../../services/infrastructure/persistence/mongoose/schemas/service.schema';

@Injectable()
export class ProviderMetricsService {
  private readonly logger = new Logger(ProviderMetricsService.name);

  constructor(
    @InjectModel(ProviderMetrics.name)
    private readonly metricsModel: Model<ProviderMetricsDocument>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>
  ) {}

  /**
   * Recalculate metrics for a single provider based on historical order/review data
   */
  async recalculateProviderMetrics(providerId: string): Promise<ProviderMetricsDocument> {
    const pId = new Types.ObjectId(providerId);

    // 1. Fetch all orders for this provider
    const orders = await this.orderModel.find({ provider: pId }).populate('service').exec();
    
    // 2. Fetch all reviews for this provider
    const reviews = await this.reviewModel.find({ provider: pId }).exec();

    const totalOrders = orders.length;

    // Default empty metrics document structure if there are zero orders
    if (totalOrders === 0) {
      const emptyMetrics = {
        provider: pId,
        totalOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        failedOrders: 0,
        completionRate: 1.0, // default high to not penalize new joins
        cancellationRate: 0.0,
        averageRating: reviews.length > 0 ? parseFloat((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(2)) : 5.0,
        totalReviews: reviews.length,
        averageResponseTime: 15.0, // default standard values
        averageArrivalTime: 30.0,
        serviceSpecializationScores: new Map(),
        cityPerformance: new Map(),
        last30DaysPerformance: { totalOrders: 0, completionRate: 1.0, averageRating: 5.0 },
        peakHourPerformance: { totalOrders: 0, completionRate: 1.0, averageRating: 5.0 }
      };

      return this.metricsModel.findOneAndUpdate(
        { provider: pId },
        { $set: emptyMetrics },
        { upsert: true, new: true }
      ).exec();
    }

    const completedOrders = orders.filter(o => o.status === 'completed');
    const cancelledOrders = orders.filter(o => o.status === 'cancelled');
    const failedOrders = orders.filter(o => o.status === 'rejected');

    const completionRate = parseFloat((completedOrders.length / totalOrders).toFixed(3));
    const cancellationRate = parseFloat((cancelledOrders.length / totalOrders).toFixed(3));

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? parseFloat((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(2))
      : 4.0;

    // Calculate response and arrival times (for completed orders)
    let totalResponseTimeMin = 0;
    let totalArrivalTimeMin = 0;
    let timedCompletedCount = 0;

    completedOrders.forEach(o => {
      if (o.acceptedAt && (o as any).createdAt) {
        const respDiff = (new Date(o.acceptedAt).getTime() - new Date((o as any).createdAt).getTime()) / (60 * 1000);
        totalResponseTimeMin += Math.max(0, respDiff);
      }
      if (o.startedAt && o.acceptedAt) {
        const arrDiff = (new Date(o.startedAt).getTime() - new Date(o.acceptedAt).getTime()) / (60 * 1000);
        totalArrivalTimeMin += Math.max(0, arrDiff);
        timedCompletedCount++;
      }
    });

    const averageResponseTime = completedOrders.length > 0
      ? parseFloat((totalResponseTimeMin / completedOrders.length).toFixed(1))
      : 15.0;

    const averageArrivalTime = timedCompletedCount > 0
      ? parseFloat((totalArrivalTimeMin / timedCompletedCount).toFixed(1))
      : 30.0;

    // 3. Service Specialization Scores (Group by category)
    const serviceSpecs = new Map<string, number>();
    const ordersByCategory: Record<string, Order[]> = {};

    orders.forEach(o => {
      const cat = (o.service as any)?.category || 'other';
      if (!ordersByCategory[cat]) ordersByCategory[cat] = [];
      ordersByCategory[cat].push(o);
    });

    for (const [cat, catOrders] of Object.entries(ordersByCategory)) {
      const catCompleted = catOrders.filter(o => o.status === 'completed').length;
      const catCompRate = catCompleted / catOrders.length;
      
      // Calculate category rating
      const catOrderIds = new Set(catOrders.map(o => (o as any)._id.toString()));
      const catReviews = reviews.filter(r => r.order && catOrderIds.has(r.order.toString()));
      const catAvgRating = catReviews.length > 0
        ? catReviews.reduce((acc, r) => acc + r.rating, 0) / catReviews.length
        : avgRating;

      // Specialization Score: Weighted combination of completion rate and average rating (0 to 1)
      const specScore = 0.5 * catCompRate + 0.5 * (catAvgRating / 5.0);
      serviceSpecs.set(cat, parseFloat(specScore.toFixed(2)));
    }

    // 4. City Performance
    const citySpecs = new Map<string, any>();
    const ordersByCity: Record<string, Order[]> = {};

    orders.forEach(o => {
      const city = o.address ? o.address.split('،').pop()?.trim() || 'unknown' : 'unknown';
      if (!ordersByCity[city]) ordersByCity[city] = [];
      ordersByCity[city].push(o);
    });

    for (const [cityName, cityOrders] of Object.entries(ordersByCity)) {
      const cityCompleted = cityOrders.filter(o => o.status === 'completed').length;
      const cityCompRate = parseFloat((cityCompleted / cityOrders.length).toFixed(3));
      
      const cityOrderIds = new Set(cityOrders.map(o => (o as any)._id.toString()));
      const cityReviews = reviews.filter(r => r.order && cityOrderIds.has(r.order.toString()));
      const cityAvgRating = cityReviews.length > 0
        ? parseFloat((cityReviews.reduce((acc, r) => acc + r.rating, 0) / cityReviews.length).toFixed(2))
        : avgRating;

      citySpecs.set(cityName, {
        totalOrders: cityOrders.length,
        completionRate: cityCompRate,
        averageRating: cityAvgRating
      });
    }

    // 5. Periodic Performance (Last 30 Days)
    const thirtyDaysAgo = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentOrders = orders.filter(o => new Date((o as any).createdAt) >= thirtyDaysAgo);
    
    let last30DaysPerformance = { totalOrders: 0, completionRate: 1.0, averageRating: avgRating };
    if (recentOrders.length > 0) {
      const recentCompleted = recentOrders.filter(o => o.status === 'completed').length;
      const recentCompRate = parseFloat((recentCompleted / recentOrders.length).toFixed(3));
      
      const recentOrderIds = new Set(recentOrders.map(o => o._id.toString()));
      const recentReviews = reviews.filter(r => r.order && recentOrderIds.has(r.order.toString()));
      const recentAvgRating = recentReviews.length > 0
        ? parseFloat((recentReviews.reduce((acc, r) => acc + r.rating, 0) / recentReviews.length).toFixed(2))
        : avgRating;

      last30DaysPerformance = {
        totalOrders: recentOrders.length,
        completionRate: recentCompRate,
        averageRating: recentAvgRating
      };
    }

    // 6. Peak Hour Performance (Peak defined as: 8am-11am & 4pm-8pm)
    const peakOrders = orders.filter(o => {
      const hour = new Date((o as any).createdAt).getHours();
      return (hour >= 8 && hour <= 11) || (hour >= 16 && hour <= 20);
    });

    let peakHourPerformance = { totalOrders: 0, completionRate: 1.0, averageRating: avgRating };
    if (peakOrders.length > 0) {
      const peakCompleted = peakOrders.filter(o => o.status === 'completed').length;
      const peakCompRate = parseFloat((peakCompleted / peakOrders.length).toFixed(3));
      
      const peakOrderIds = new Set(peakOrders.map(o => o._id.toString()));
      const peakReviews = reviews.filter(r => r.order && peakOrderIds.has(r.order.toString()));
      const peakAvgRating = peakReviews.length > 0
        ? parseFloat((peakReviews.reduce((acc, r) => acc + r.rating, 0) / peakReviews.length).toFixed(2))
        : avgRating;

      peakHourPerformance = {
        totalOrders: peakOrders.length,
        completionRate: peakCompRate,
        averageRating: peakAvgRating
      };
    }

    // Construct metrics document
    const metricsData = {
      provider: pId,
      totalOrders,
      completedOrders: completedOrders.length,
      cancelledOrders: cancelledOrders.length,
      failedOrders: failedOrders.length,
      completionRate,
      cancellationRate,
      averageRating: avgRating,
      totalReviews: reviews.length,
      averageResponseTime,
      averageArrivalTime,
      serviceSpecializationScores: serviceSpecs,
      cityPerformance: citySpecs,
      last30DaysPerformance,
      peakHourPerformance
    };

    return this.metricsModel.findOneAndUpdate(
      { provider: pId },
      { $set: metricsData },
      { upsert: true, new: true }
    ).exec();
  }

}
