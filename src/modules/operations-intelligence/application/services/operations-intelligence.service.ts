import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from '../../../orders/infrastructure/persistence/mongoose/schemas/order.schema';
import { Provider, ProviderDocument } from '../../../providers/infrastructure/persistence/mongoose/schemas/provider.schema';
import { Service, ServiceDocument } from '../../../services/infrastructure/persistence/mongoose/schemas/service.schema';
import { OrderStatus, ProviderStatus, RegistrationStatus } from '../../../../core/enums/status.enum';
import { PressureScoreEngine } from './pressure-score.engine';

export type OperationsIntelligenceQuery = {
  days?: number;
  previousDays?: number;
  limit?: number;
  city?: string;
  serviceId?: string;
};

type DemandBucket = {
  key: string;
  city: string;
  governorate?: string;
  serviceId: string;
  serviceName: string;
  serviceNameAr?: string;
  ordersCount: number;
  previousOrdersCount: number;
  completedOrders: number;
  cancelledOrders: number;
  rejectedOrders: number;
  unassignedOrders: number;
  avgResponseMinutes: number;
  activeProviders: number;
};

const ACTIVE_ORDER_STATUSES = [
  OrderStatus.ACCEPTED,
  OrderStatus.PROVIDER_ASSIGNED,
  OrderStatus.PROVIDER_EN_ROUTE,
  OrderStatus.PROVIDER_ARRIVED,
  OrderStatus.IN_PROGRESS,
];

@Injectable()
export class OperationsIntelligenceService {
  private readonly scoreEngine = new PressureScoreEngine();

  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Provider.name) private readonly providerModel: Model<ProviderDocument>,
    @InjectModel(Service.name) private readonly serviceModel: Model<ServiceDocument>,
  ) {}

  async getPreview(query: OperationsIntelligenceQuery = {}) {
    const days = this.safeNumber(query.days, 14, 1, 90);
    const previousDays = this.safeNumber(query.previousDays, days, 1, 90);
    const limit = this.safeNumber(query.limit, 25, 5, 100);
    const now = new Date();
    const currentStart = this.daysAgo(now, days);
    const previousStart = this.daysAgo(currentStart, previousDays);

    const [services, demandRows, providerCoverage, providerWorkloadRows, underusedProviders] = await Promise.all([
      this.serviceModel.find({}).select('_id name nameAr category isActive').lean().exec(),
      this.getDemandRows(previousStart, currentStart, query),
      this.getProviderCoverage(query),
      this.getProviderWorkload(currentStart, query),
      this.getUnderusedProviders(currentStart, query, 12),
    ]);

    const serviceMap = new Map(services.map((service: any) => [
      service._id.toString(),
      {
        serviceName: service.name,
        serviceNameAr: service.nameAr,
        category: service.category,
      },
    ]));

    const coverageMap = new Map<string, number>();
    for (const item of providerCoverage) {
      coverageMap.set(this.keyFor(item.city, item.governorate, item.serviceId), item.activeProviders);
    }

    const buckets = this.buildDemandBuckets(demandRows, coverageMap, serviceMap);
    const pressureAreas = buckets
      .map((bucket) => {
        const pressure = this.scoreEngine.calculate(bucket);
        return {
          ...bucket,
          ...pressure,
        };
      })
      .sort((a, b) => b.pressureScore - a.pressureScore || b.ordersCount - a.ordersCount)
      .slice(0, limit);

    const recommendations = buckets
      .map((bucket) => this.scoreEngine.createRecruitmentRecommendation(bucket))
      .filter(Boolean)
      .sort((a: any, b: any) => b.evidence.pressureScore - a.evidence.pressureScore)
      .slice(0, limit);

    const providerWorkload = this.classifyProviderWorkload(providerWorkloadRows, coverageMap)
      .concat(underusedProviders.map((provider) => ({
        providerId: provider._id.toString(),
        businessName: provider.businessName,
        city: provider.city || provider.governorate || 'unknown',
        governorate: provider.governorate,
        status: provider.status,
        averageRating: provider.averageRating || 0,
        totalOrders: 0,
        completedOrders: 0,
        activeOrders: 0,
        cancelledOrders: 0,
        avgResponseMinutes: 0,
        completionRate: 0,
        cancelRate: 0,
        workloadLevel: 'underused',
        reasons: ['Provider is active and approved but has no recent orders in the analysis window'],
      })))
      .sort((a, b) => this.workloadRank(b.workloadLevel) - this.workloadRank(a.workloadLevel) || b.totalOrders - a.totalOrders)
      .slice(0, limit);

    return {
      meta: {
        generatedAt: now,
        window: {
          days,
          previousDays,
          currentStart,
          previousStart,
        },
        filters: {
          city: query.city,
          serviceId: query.serviceId,
        },
      },
      summary: this.summaryFor(pressureAreas, recommendations),
      pressureAreas,
      recommendations,
      providerWorkload,
    };
  }

  private async getDemandRows(previousStart: Date, currentStart: Date, query: OperationsIntelligenceQuery) {
    const match: any = {
      createdAt: { $gte: previousStart },
    };
    if (query.serviceId && Types.ObjectId.isValid(query.serviceId)) {
      match.service = new Types.ObjectId(query.serviceId);
    }

    const cityRegex = query.city ? new RegExp(this.escapeRegex(query.city), 'i') : null;

    const pipeline: any[] = [
      { $match: match },
      {
        $lookup: {
          from: 'providers',
          localField: 'provider',
          foreignField: '_id',
          as: 'providerInfo',
        },
      },
      { $unwind: { path: '$providerInfo', preserveNullAndEmptyArrays: true } },
      ...(cityRegex
        ? [{
            $match: {
              $or: [
                { 'providerInfo.city': cityRegex },
                { 'providerInfo.governorate': cityRegex },
                { address: cityRegex },
                { 'metadata.city': cityRegex },
                { 'metadata.governorate': cityRegex },
              ],
            },
          }]
        : []),
      {
        $addFields: {
          period: { $cond: [{ $gte: ['$createdAt', currentStart] }, 'current', 'previous'] },
          areaCity: {
            $ifNull: [
              '$providerInfo.city',
              { $ifNull: ['$metadata.city', { $ifNull: ['$providerInfo.governorate', 'unknown'] }] },
            ],
          },
          areaGovernorate: {
            $ifNull: ['$providerInfo.governorate', { $ifNull: ['$metadata.governorate', '$providerInfo.city'] }],
          },
          responseMinutes: {
            $cond: [
              { $and: ['$acceptedAt', '$createdAt'] },
              { $divide: [{ $subtract: ['$acceptedAt', '$createdAt'] }, 60000] },
              null,
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            period: '$period',
            city: '$areaCity',
            governorate: '$areaGovernorate',
            serviceId: '$service',
          },
          ordersCount: { $sum: 1 },
          completedOrders: { $sum: { $cond: [{ $eq: ['$status', OrderStatus.COMPLETED] }, 1, 0] } },
          cancelledOrders: { $sum: { $cond: [{ $eq: ['$status', OrderStatus.CANCELLED] }, 1, 0] } },
          rejectedOrders: { $sum: { $cond: [{ $eq: ['$status', OrderStatus.REJECTED] }, 1, 0] } },
          unassignedOrders: { $sum: { $cond: [{ $not: ['$provider'] }, 1, 0] } },
          avgResponseMinutes: { $avg: '$responseMinutes' },
        },
      },
    ];

    return this.orderModel.aggregate(pipeline).exec();
  }

  private async getProviderCoverage(query: OperationsIntelligenceQuery) {
    const match: any = {
      isActive: { $ne: false },
      isApproved: true,
      registrationStatus: RegistrationStatus.APPROVED,
    };
    if (query.city) {
      const cityRegex = new RegExp(this.escapeRegex(query.city), 'i');
      match.$or = [{ city: cityRegex }, { governorate: cityRegex }];
    }
    if (query.serviceId && Types.ObjectId.isValid(query.serviceId)) {
      match.services = new Types.ObjectId(query.serviceId);
    }

    return this.providerModel.aggregate([
      { $match: match },
      { $unwind: { path: '$services', preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: {
            city: { $ifNull: ['$city', { $ifNull: ['$governorate', 'unknown'] }] },
            governorate: { $ifNull: ['$governorate', '$city'] },
            serviceId: '$services',
          },
          activeProviders: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          city: '$_id.city',
          governorate: '$_id.governorate',
          serviceId: { $toString: '$_id.serviceId' },
          activeProviders: 1,
        },
      },
    ]).exec();
  }

  private async getProviderWorkload(currentStart: Date, query: OperationsIntelligenceQuery) {
    const match: any = {
      provider: { $ne: null },
      createdAt: { $gte: currentStart },
    };
    if (query.serviceId && Types.ObjectId.isValid(query.serviceId)) {
      match.service = new Types.ObjectId(query.serviceId);
    }

    const cityRegex = query.city ? new RegExp(this.escapeRegex(query.city), 'i') : null;

    return this.orderModel.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'providers',
          localField: 'provider',
          foreignField: '_id',
          as: 'providerInfo',
        },
      },
      { $unwind: '$providerInfo' },
      ...(cityRegex ? [{ $match: { $or: [{ 'providerInfo.city': cityRegex }, { 'providerInfo.governorate': cityRegex }] } }] : []),
      {
        $addFields: {
          responseMinutes: {
            $cond: [
              { $and: ['$acceptedAt', '$createdAt'] },
              { $divide: [{ $subtract: ['$acceptedAt', '$createdAt'] }, 60000] },
              null,
            ],
          },
        },
      },
      {
        $group: {
          _id: '$provider',
          businessName: { $first: '$providerInfo.businessName' },
          city: { $first: '$providerInfo.city' },
          governorate: { $first: '$providerInfo.governorate' },
          status: { $first: '$providerInfo.status' },
          averageRating: { $first: { $ifNull: ['$providerInfo.averageRating', 0] } },
          serviceIds: { $addToSet: '$service' },
          totalOrders: { $sum: 1 },
          completedOrders: { $sum: { $cond: [{ $eq: ['$status', OrderStatus.COMPLETED] }, 1, 0] } },
          activeOrders: { $sum: { $cond: [{ $in: ['$status', ACTIVE_ORDER_STATUSES] }, 1, 0] } },
          cancelledOrders: { $sum: { $cond: [{ $in: ['$status', [OrderStatus.CANCELLED, OrderStatus.REJECTED]] }, 1, 0] } },
          avgResponseMinutes: { $avg: '$responseMinutes' },
          lastOrderAt: { $max: '$createdAt' },
        },
      },
      { $sort: { totalOrders: -1, activeOrders: -1 } },
      { $limit: 100 },
    ]).exec();
  }

  private async getUnderusedProviders(currentStart: Date, query: OperationsIntelligenceQuery, limit: number) {
    const activeMatch: any = {
      isActive: { $ne: false },
      isApproved: true,
      registrationStatus: RegistrationStatus.APPROVED,
    };
    if (query.city) {
      const cityRegex = new RegExp(this.escapeRegex(query.city), 'i');
      activeMatch.$or = [{ city: cityRegex }, { governorate: cityRegex }];
    }
    if (query.serviceId && Types.ObjectId.isValid(query.serviceId)) {
      activeMatch.services = new Types.ObjectId(query.serviceId);
    }

    return this.providerModel.aggregate([
      { $match: activeMatch },
      {
        $lookup: {
          from: 'orders',
          let: { providerId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$provider', '$$providerId'] },
                createdAt: { $gte: currentStart },
              },
            },
            { $limit: 1 },
          ],
          as: 'recentOrders',
        },
      },
      { $match: { recentOrders: { $size: 0 } } },
      {
        $project: {
          businessName: 1,
          city: 1,
          governorate: 1,
          status: 1,
          averageRating: 1,
        },
      },
      { $sort: { averageRating: -1, businessName: 1 } },
      { $limit: limit },
    ]).exec();
  }

  private buildDemandBuckets(rows: any[], coverageMap: Map<string, number>, serviceMap: Map<string, any>) {
    const buckets = new Map<string, DemandBucket>();
    for (const row of rows) {
      const serviceId = row._id.serviceId?.toString?.() || String(row._id.serviceId || 'unknown');
      const city = row._id.city || 'unknown';
      const governorate = row._id.governorate || city;
      const key = this.keyFor(city, governorate, serviceId);
      const service = serviceMap.get(serviceId) || {};
      const current = buckets.get(key) || {
        key,
        city,
        governorate,
        serviceId,
        serviceName: service.serviceName || 'Unknown service',
        serviceNameAr: service.serviceNameAr,
        ordersCount: 0,
        previousOrdersCount: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        rejectedOrders: 0,
        unassignedOrders: 0,
        avgResponseMinutes: 0,
        activeProviders: coverageMap.get(key) || 0,
      };

      if (row._id.period === 'current') {
        current.ordersCount += Number(row.ordersCount || 0);
        current.completedOrders += Number(row.completedOrders || 0);
        current.cancelledOrders += Number(row.cancelledOrders || 0);
        current.rejectedOrders += Number(row.rejectedOrders || 0);
        current.unassignedOrders += Number(row.unassignedOrders || 0);
        current.avgResponseMinutes = Number((row.avgResponseMinutes || 0).toFixed?.(1) || row.avgResponseMinutes || 0);
      } else {
        current.previousOrdersCount += Number(row.ordersCount || 0);
      }
      buckets.set(key, current);
    }

    return Array.from(buckets.values()).filter((bucket) => bucket.ordersCount > 0);
  }

  private classifyProviderWorkload(rows: any[], coverageMap: Map<string, number>) {
    return rows.map((row) => {
      const totalOrders = Number(row.totalOrders || 0);
      const cancelledOrders = Number(row.cancelledOrders || 0);
      const completedOrders = Number(row.completedOrders || 0);
      const activeOrders = Number(row.activeOrders || 0);
      const avgResponseMinutes = Number((row.avgResponseMinutes || 0).toFixed?.(1) || row.avgResponseMinutes || 0);
      const cancelRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;
      const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
      const reasons: string[] = [];

      let workloadLevel = 'normal';
      if (totalOrders >= 8 && (avgResponseMinutes >= 30 || activeOrders >= 3)) {
        workloadLevel = 'overloaded';
        reasons.push('High recent order volume with elevated response time or active workload');
      } else if (totalOrders >= 5 && completionRate >= 85 && Number(row.averageRating || 0) >= 4) {
        workloadLevel = 'champion';
        reasons.push('High completion rate and strong rating with meaningful recent demand');
      }
      if (cancelRate >= 25 || (totalOrders >= 3 && Number(row.averageRating || 0) > 0 && Number(row.averageRating || 0) < 3)) {
        workloadLevel = 'risky';
        reasons.push('Cancellation rate or rating indicates operational risk');
      }
      if (row.status === ProviderStatus.BUSY && activeOrders >= 2) {
        reasons.push('Provider is currently busy with multiple active orders');
      }

      const serviceIds = (row.serviceIds || []).map((serviceId: any) => serviceId?.toString?.() || String(serviceId));
      const isStrategic = serviceIds.some((serviceId: string) => {
        const key = this.keyFor(row.city || row.governorate || 'unknown', row.governorate || row.city, serviceId);
        return (coverageMap.get(key) || 0) <= 1;
      });
      if (isStrategic && totalOrders > 0) {
        workloadLevel = workloadLevel === 'normal' ? 'strategic' : workloadLevel;
        reasons.push('Provider appears to be one of the only active options for at least one service in the area');
      }

      return {
        providerId: row._id.toString(),
        businessName: row.businessName,
        city: row.city || row.governorate || 'unknown',
        governorate: row.governorate,
        status: row.status,
        averageRating: row.averageRating || 0,
        totalOrders,
        completedOrders,
        activeOrders,
        cancelledOrders,
        avgResponseMinutes,
        completionRate: Number(completionRate.toFixed(1)),
        cancelRate: Number(cancelRate.toFixed(1)),
        workloadLevel,
        reasons: reasons.length ? reasons : ['Recent workload is within the normal operating range'],
      };
    });
  }

  private summaryFor(pressureAreas: any[], recommendations: any[]) {
    const averagePressure = pressureAreas.length
      ? pressureAreas.reduce((sum, area) => sum + area.pressureScore, 0) / pressureAreas.length
      : 0;
    const criticalAreas = pressureAreas.filter((area) => area.level === 'critical').length;
    const pressuredAreas = pressureAreas.filter((area) => area.level === 'pressured').length;

    return {
      networkHealthScore: Math.max(0, Math.round(100 - averagePressure)),
      analyzedAreaServices: pressureAreas.length,
      criticalAreas,
      pressuredAreas,
      recommendationsCount: recommendations.length,
      topRecommendation: recommendations[0] || null,
    };
  }

  private keyFor(city?: string, governorate?: string, serviceId?: string) {
    return [
      String(city || 'unknown').trim().toLowerCase(),
      String(governorate || city || 'unknown').trim().toLowerCase(),
      String(serviceId || 'unknown'),
    ].join('|');
  }

  private workloadRank(level: string) {
    return {
      overloaded: 5,
      risky: 4,
      strategic: 3,
      champion: 2,
      normal: 1,
      underused: 0,
    }[level] ?? 0;
  }

  private daysAgo(date: Date, days: number) {
    return new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
  }

  private safeNumber(value: any, fallback: number, min: number, max: number) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(Math.max(Math.floor(number), min), max);
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
