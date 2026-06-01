import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AiRecommendationLog, AiRecommendationLogDocument } from '../../infrastructure/schemas/ai-recommendation-log.schema';

export interface AiAnalyticsFilters {
  period?: 'all' | '30d' | '90d' | '365d';
  city?: string;
  serviceCategory?: string;
  modelType?: string;
  status?: 'success' | 'failed';
  search?: string;
  page?: string | number;
  limit?: string | number;
}

@Injectable()
export class AiAnalyticsService {
  constructor(
    @InjectModel(AiRecommendationLog.name)
    private readonly logModel: Model<AiRecommendationLogDocument>,
  ) {}

  private buildMatch(filters: AiAnalyticsFilters = {}): any {
    const match: any = {};
    if (filters.period && filters.period !== 'all') {
      const days = Number(filters.period.replace('d', ''));
      match.createdAt = { $gte: new Date(Date.now() - days * 86400000) };
    }
    if (filters.city) match['criteria.city'] = filters.city;
    if (filters.serviceCategory) match['criteria.serviceCategory'] = filters.serviceCategory;
    if (filters.modelType) match.modelType = filters.modelType;
    if (filters.status) match.status = filters.status;
    if (filters.search?.trim()) {
      const regex = new RegExp(filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      match.$or = [
        { 'criteria.city': regex },
        { 'criteria.serviceCategory': regex },
        { modelType: regex },
        { modelVersion: regex },
        { errorMessage: regex },
      ];
    }
    return match;
  }

  async getSummary(filters: AiAnalyticsFilters = {}) {
    const match = this.buildMatch(filters);
    const [totalLogs, successLogs, failedLogs, confidenceAgg, modelTypeAgg, candidateAgg, dailyTrend, confidenceTrend] =
      await Promise.all([
        this.logModel.countDocuments(match),
        this.logModel.countDocuments({ ...match, status: 'success' }),
        this.logModel.countDocuments({ ...match, status: 'failed' }),
        this.logModel.aggregate([
          { $match: { ...match, status: 'success' } },
          { $unwind: '$recommendations' },
          { $group: { _id: null, avgConfidence: { $avg: '$recommendations.confidence' } } },
        ]),
        this.logModel.aggregate([{ $match: match }, { $group: { _id: '$modelType', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
        this.logModel.aggregate([{ $match: { ...match, status: 'success' } }, { $group: { _id: null, avgCandidates: { $avg: '$candidateCount' } } }]),
        this.getTrend(match),
        this.getConfidenceTrend(match),
      ]);

    return {
      totalRecommendations: totalLogs,
      successfulRecommendations: successLogs,
      failedRecommendations: failedLogs,
      successRate: totalLogs ? Number(((successLogs / totalLogs) * 100).toFixed(2)) : 0,
      averageConfidence: confidenceAgg[0]?.avgConfidence ? Number(confidenceAgg[0].avgConfidence.toFixed(3)) : 0,
      averageCandidates: candidateAgg[0]?.avgCandidates ? Number(candidateAgg[0].avgCandidates.toFixed(1)) : 0,
      modelTypeDistribution: modelTypeAgg.map((item) => ({ modelType: item._id || 'unknown', count: item.count })),
      dailyTrend,
      confidenceTrend,
    };
  }

  private async getTrend(match: any) {
    const rows = await this.logModel.aggregate([
      { $match: match },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        total: { $sum: 1 },
        success: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
      } },
      { $sort: { _id: -1 } },
      { $limit: 30 },
      { $sort: { _id: 1 } },
    ]);
    return rows.map((item) => ({ date: item._id, total: item.total, success: item.success, failed: item.failed }));
  }

  private async getConfidenceTrend(match: any) {
    const rows = await this.logModel.aggregate([
      { $match: { ...match, status: 'success' } },
      { $unwind: '$recommendations' },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, avgConfidence: { $avg: '$recommendations.confidence' } } },
      { $sort: { _id: -1 } },
      { $limit: 30 },
      { $sort: { _id: 1 } },
    ]);
    return rows.map((item) => ({ date: item._id, avgConfidence: Number(item.avgConfidence.toFixed(3)) }));
  }

  async getTopProviders(filters: AiAnalyticsFilters = {}, limit = 10) {
    const topProviders = await this.logModel.aggregate([
      { $match: { ...this.buildMatch(filters), status: 'success' } },
      { $unwind: '$recommendations' },
      { $group: {
        _id: '$recommendations.provider',
        recommendationCount: { $sum: 1 },
        avgScore: { $avg: '$recommendations.score' },
        avgConfidence: { $avg: '$recommendations.confidence' },
        avgDistance: { $avg: '$recommendations.distanceKm' },
      } },
      { $sort: { recommendationCount: -1 } },
      { $limit: Math.min(Math.max(limit, 1), 100) },
      { $lookup: { from: 'providers', localField: '_id', foreignField: '_id', as: 'providerInfo' } },
      { $unwind: { path: '$providerInfo', preserveNullAndEmptyArrays: true } },
      { $project: {
        providerId: '$_id',
        businessName: { $ifNull: ['$providerInfo.businessName', 'غير معروف'] },
        category: { $ifNull: ['$providerInfo.category', 'غير محدد'] },
        city: { $ifNull: ['$providerInfo.city', 'غير محدد'] },
        recommendationCount: 1,
        avgScore: { $round: ['$avgScore', 2] },
        avgConfidence: { $round: ['$avgConfidence', 3] },
        avgDistance: { $round: ['$avgDistance', 1] },
      } },
    ]);
    return { topProviders };
  }

  async getServicePerformance(filters: AiAnalyticsFilters = {}) {
    return { servicePerformance: await this.getGroupedPerformance(filters, '$criteria.serviceCategory', 'serviceCategory') };
  }

  async getCityPerformance(filters: AiAnalyticsFilters = {}) {
    return { cityPerformance: await this.getGroupedPerformance(filters, '$criteria.city', 'city') };
  }

  private async getGroupedPerformance(filters: AiAnalyticsFilters, groupBy: string, key: string) {
    const rows = await this.logModel.aggregate([
      { $match: this.buildMatch(filters) },
      { $unwind: { path: '$recommendations', preserveNullAndEmptyArrays: true } },
      { $group: {
        _id: { group: groupBy, log: '$_id' },
        status: { $first: '$status' },
        candidateCount: { $first: '$candidateCount' },
        confidence: { $avg: '$recommendations.confidence' },
        score: { $avg: '$recommendations.score' },
      } },
      { $group: {
        _id: '$_id.group',
        totalRequests: { $sum: 1 },
        successRequests: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
        failedRequests: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        avgCandidates: { $avg: '$candidateCount' },
        avgConfidence: { $avg: '$confidence' },
        avgScore: { $avg: '$score' },
      } },
      { $sort: { totalRequests: -1 } },
    ]);
    return rows.map((item) => ({
      [key]: item._id || 'unknown',
      totalRequests: item.totalRequests,
      successRequests: item.successRequests,
      failedRequests: item.failedRequests,
      successRate: item.totalRequests ? Number(((item.successRequests / item.totalRequests) * 100).toFixed(2)) : 0,
      avgCandidates: Number((item.avgCandidates || 0).toFixed(1)),
      avgConfidence: Number((item.avgConfidence || 0).toFixed(3)),
      avgScore: Number((item.avgScore || 0).toFixed(2)),
    }));
  }

  async getFilters() {
    const [cities, serviceCategories, modelTypes, statuses] = await Promise.all([
      this.logModel.distinct('criteria.city'),
      this.logModel.distinct('criteria.serviceCategory'),
      this.logModel.distinct('modelType'),
      this.logModel.distinct('status'),
    ]);
    return { cities: cities.sort(), serviceCategories: serviceCategories.sort(), modelTypes: modelTypes.sort(), statuses: statuses.sort() };
  }

  async getLogs(filters: AiAnalyticsFilters = {}) {
    const page = Math.max(Number(filters.page) || 1, 1);
    const limit = Math.min(Math.max(Number(filters.limit) || 10, 1), 100);
    const match = this.buildMatch(filters);
    const [logs, total] = await Promise.all([
      this.logModel.find(match).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.logModel.countDocuments(match),
    ]);
    return {
      logs: logs.map((log: any) => ({
        id: String(log._id),
        date: log.createdAt,
        city: log.criteria?.city,
        serviceCategory: log.criteria?.serviceCategory,
        modelType: log.modelType,
        modelVersion: log.modelVersion,
        status: log.status,
        candidateCount: log.candidateCount,
        recommendationCount: log.recommendations?.length || 0,
        chosenProvider: log.chosenProvider ? String(log.chosenProvider) : null,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async exportCsv(filters: AiAnalyticsFilters = {}) {
    const rows = await this.logModel.find(this.buildMatch(filters)).sort({ createdAt: -1 }).limit(5000).lean();
    const logs = rows.map((log: any) => ({
      date: log.createdAt,
      city: log.criteria?.city,
      serviceCategory: log.criteria?.serviceCategory,
      modelType: log.modelType,
      modelVersion: log.modelVersion,
      status: log.status,
      candidateCount: log.candidateCount,
      recommendationCount: log.recommendations?.length || 0,
      chosenProvider: log.chosenProvider ? String(log.chosenProvider) : '',
    }));
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const header = ['date', 'city', 'serviceCategory', 'modelType', 'modelVersion', 'status', 'candidateCount', 'recommendationCount', 'chosenProvider'];
    return [header.join(','), ...logs.map((log: any) => header.map((key) => escape(log[key])).join(','))].join('\n');
  }
}
