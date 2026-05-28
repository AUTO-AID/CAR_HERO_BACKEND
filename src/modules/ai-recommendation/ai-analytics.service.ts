import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AiRecommendationLog, AiRecommendationLogDocument } from './schemas/ai-recommendation-log.schema';

@Injectable()
export class AiAnalyticsService {
  private readonly logger = new Logger(AiAnalyticsService.name);

  constructor(
    @InjectModel(AiRecommendationLog.name)
    private readonly logModel: Model<AiRecommendationLogDocument>,
  ) {}

  /**
   * GET /admin/ai-recommendations/summary
   * Returns overall summary statistics for AI recommendations
   */
  async getSummary() {
    const [totalLogs, successLogs, failedLogs] = await Promise.all([
      this.logModel.countDocuments(),
      this.logModel.countDocuments({ status: 'success' }),
      this.logModel.countDocuments({ status: 'failed' }),
    ]);

    const successRate = totalLogs > 0 ? parseFloat(((successLogs / totalLogs) * 100).toFixed(2)) : 0;

    // Average confidence across all successful recommendations
    const confidenceAgg = await this.logModel.aggregate([
      { $match: { status: 'success' } },
      { $unwind: '$recommendations' },
      { $group: { _id: null, avgConfidence: { $avg: '$recommendations.confidence' } } },
    ]);
    const averageConfidence = confidenceAgg.length > 0
      ? parseFloat(confidenceAgg[0].avgConfidence.toFixed(3))
      : 0;

    // Model type distribution
    const modelTypeAgg = await this.logModel.aggregate([
      { $group: { _id: '$modelType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const modelTypeDistribution = modelTypeAgg.map(m => ({
      modelType: m._id || 'unknown',
      count: m.count,
    }));

    // Average candidates per recommendation
    const candidateAgg = await this.logModel.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, avgCandidates: { $avg: '$candidateCount' } } },
    ]);
    const averageCandidates = candidateAgg.length > 0
      ? parseFloat(candidateAgg[0].avgCandidates.toFixed(1))
      : 0;

    // Daily recommendation trend (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dailyTrend = await this.logModel.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: 1 },
          success: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Confidence trend over time (last 30 days, daily average)
    const confidenceTrend = await this.logModel.aggregate([
      { $match: { status: 'success', createdAt: { $gte: thirtyDaysAgo } } },
      { $unwind: '$recommendations' },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          avgConfidence: { $avg: '$recommendations.confidence' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      totalRecommendations: totalLogs,
      successfulRecommendations: successLogs,
      failedRecommendations: failedLogs,
      successRate,
      averageConfidence,
      averageCandidates,
      modelTypeDistribution,
      dailyTrend: dailyTrend.map(d => ({
        date: d._id,
        total: d.total,
        success: d.success,
        failed: d.failed,
      })),
      confidenceTrend: confidenceTrend.map(d => ({
        date: d._id,
        avgConfidence: parseFloat(d.avgConfidence.toFixed(3)),
      })),
    };
  }

  /**
   * GET /admin/ai-recommendations/top-providers
   * Returns top recommended providers with frequency and scores
   */
  async getTopProviders(limit = 10) {
    const topProviders = await this.logModel.aggregate([
      { $match: { status: 'success' } },
      { $unwind: '$recommendations' },
      {
        $group: {
          _id: '$recommendations.provider',
          recommendationCount: { $sum: 1 },
          avgScore: { $avg: '$recommendations.score' },
          avgConfidence: { $avg: '$recommendations.confidence' },
          avgDistance: { $avg: '$recommendations.distanceKm' },
        },
      },
      { $sort: { recommendationCount: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'providers',
          localField: '_id',
          foreignField: '_id',
          as: 'providerInfo',
        },
      },
      { $unwind: { path: '$providerInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          providerId: '$_id',
          businessName: { $ifNull: ['$providerInfo.businessName', 'غير معروف'] },
          category: { $ifNull: ['$providerInfo.category', 'غير محدد'] },
          city: { $ifNull: ['$providerInfo.city', 'غير محدد'] },
          recommendationCount: 1,
          avgScore: { $round: ['$avgScore', 2] },
          avgConfidence: { $round: ['$avgConfidence', 3] },
          avgDistance: { $round: ['$avgDistance', 1] },
        },
      },
    ]);

    return { topProviders };
  }

  /**
   * GET /admin/ai-recommendations/service-performance
   * Returns recommendation statistics grouped by service category
   */
  async getServicePerformance() {
    const serviceStats = await this.logModel.aggregate([
      {
        $group: {
          _id: '$criteria.serviceCategory',
          totalRequests: { $sum: 1 },
          successRequests: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
          failedRequests: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          avgCandidates: { $avg: '$candidateCount' },
        },
      },
      { $sort: { totalRequests: -1 } },
      {
        $project: {
          serviceCategory: '$_id',
          totalRequests: 1,
          successRequests: 1,
          failedRequests: 1,
          successRate: {
            $round: [
              { $multiply: [{ $cond: [{ $gt: ['$totalRequests', 0] }, { $divide: ['$successRequests', '$totalRequests'] }, 0] }, 100] },
              2,
            ],
          },
          avgCandidates: { $round: ['$avgCandidates', 1] },
        },
      },
    ]);

    // Average confidence per service
    const confidenceByService = await this.logModel.aggregate([
      { $match: { status: 'success' } },
      { $unwind: '$recommendations' },
      {
        $group: {
          _id: '$criteria.serviceCategory',
          avgConfidence: { $avg: '$recommendations.confidence' },
          avgScore: { $avg: '$recommendations.score' },
        },
      },
    ]);

    const confMap = new Map(confidenceByService.map(c => [c._id, c]));

    const merged = serviceStats.map(s => {
      const conf = confMap.get(s.serviceCategory);
      return {
        ...s,
        _id: undefined,
        avgConfidence: conf ? parseFloat(conf.avgConfidence.toFixed(3)) : 0,
        avgScore: conf ? parseFloat(conf.avgScore.toFixed(2)) : 0,
      };
    });

    return { servicePerformance: merged };
  }

  /**
   * GET /admin/ai-recommendations/city-performance
   * Returns recommendation statistics grouped by city
   */
  async getCityPerformance() {
    const cityStats = await this.logModel.aggregate([
      {
        $group: {
          _id: '$criteria.city',
          totalRequests: { $sum: 1 },
          successRequests: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
          failedRequests: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          avgCandidates: { $avg: '$candidateCount' },
        },
      },
      { $sort: { totalRequests: -1 } },
      {
        $project: {
          city: '$_id',
          totalRequests: 1,
          successRequests: 1,
          failedRequests: 1,
          successRate: {
            $round: [
              { $multiply: [{ $cond: [{ $gt: ['$totalRequests', 0] }, { $divide: ['$successRequests', '$totalRequests'] }, 0] }, 100] },
              2,
            ],
          },
          avgCandidates: { $round: ['$avgCandidates', 1] },
        },
      },
    ]);

    // Average confidence per city
    const confidenceByCity = await this.logModel.aggregate([
      { $match: { status: 'success' } },
      { $unwind: '$recommendations' },
      {
        $group: {
          _id: '$criteria.city',
          avgConfidence: { $avg: '$recommendations.confidence' },
          avgScore: { $avg: '$recommendations.score' },
        },
      },
    ]);

    const confMap = new Map(confidenceByCity.map(c => [c._id, c]));

    const merged = cityStats.map(s => {
      const conf = confMap.get(s.city);
      return {
        ...s,
        _id: undefined,
        avgConfidence: conf ? parseFloat(conf.avgConfidence.toFixed(3)) : 0,
        avgScore: conf ? parseFloat(conf.avgScore.toFixed(2)) : 0,
      };
    });

    return { cityPerformance: merged };
  }
}
