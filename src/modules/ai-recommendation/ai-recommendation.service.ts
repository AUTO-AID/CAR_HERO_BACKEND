import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Provider, ProviderDocument } from '../providers/infrastructure/persistence/mongoose/schemas/provider.schema';
import { AiRecommendationLog, AiRecommendationLogDocument } from './schemas/ai-recommendation-log.schema';
import { ProviderMetrics, ProviderMetricsDocument } from './schemas/provider-metrics.schema';
import { RecommendProviderDto } from './dtos/recommend-provider.dto';
import { RecommendationResponseDto } from './dtos/recommendation-response.dto';
import { RuleBasedRecommendationProvider } from './providers/rule-based.provider';
import { MlRecommendationProvider } from './providers/ml-model.provider';
import { ProviderScoringService } from './provider-scoring.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';


@Injectable()
export class AiRecommendationService {
  private readonly logger = new Logger(AiRecommendationService.name);

  constructor(
    @InjectModel(Provider.name)
    private readonly providerModel: Model<ProviderDocument>,
    @InjectModel(AiRecommendationLog.name)
    private readonly logModel: Model<AiRecommendationLogDocument>,
    @InjectModel(ProviderMetrics.name)
    private readonly metricsModel: Model<ProviderMetricsDocument>,
    private readonly ruleBasedProvider: RuleBasedRecommendationProvider,
    private readonly mlModelProvider: MlRecommendationProvider,
    private readonly scoringService: ProviderScoringService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache
  ) {}

  /**
   * Core recommendation logic supporting both rule_based and ml_model modes
   */
  async recommend(dto: RecommendProviderDto, userId?: string): Promise<RecommendationResponseDto> {
    this.logger.log(`Received recommendation request for Category: "${dto.serviceCategory}", City: "${dto.city}"`);

    // 1. Check Recommendation Cache
    // Round latitude and longitude to 3 decimal places to create a ~110m grid
    const roundedLat = parseFloat(dto.location.lat.toFixed(3));
    const roundedLng = parseFloat(dto.location.lng.toFixed(3));
    const cacheKey = `ai_rec_out:${dto.serviceCategory}:${dto.city || 'all'}:${dto.urgencyLevel || 'standard'}:${roundedLat}:${roundedLng}`;

    try {
      const cachedResponse = await this.cacheManager.get<RecommendationResponseDto>(cacheKey);
      if (cachedResponse) {
        this.logger.log(`[Cache Hit] Returning cached recommendation results for key: ${cacheKey}`);
        return cachedResponse;
      }
    } catch (cacheErr) {
      this.logger.warn(`Failed to read from recommendation cache: ${cacheErr.message}`);
    }

    // 2. Fetch matching providers from MongoDB
    let providers = await this.fetchProviders(dto.serviceCategory, dto.city, dto.excludeProviderIds);
    let isFallbackUsed = false;

    // Fallback: If no providers found for this category, search all active/approved providers in the city
    if (providers.length === 0) {
      this.logger.warn(`No providers found for category "${dto.serviceCategory}" in "${dto.city}". Running fallback query...`);
      providers = await this.fetchProvidersFallback(dto.city, dto.excludeProviderIds);
      isFallbackUsed = true;
    }

    const candidateCount = providers.length;

    // 3. Handle failure scenario (no candidates found at all)
    if (candidateCount === 0) {
      this.logger.error(`No providers found in "${dto.city}" even after fallback query.`);
      
      const configMode = (process.env.AI_RECOMMENDATION_MODE || 'rule_based').toLowerCase();
      const logDoc = new this.logModel({
        user: userId ? new Types.ObjectId(userId) : undefined,
        criteria: {
          serviceCategory: dto.serviceCategory,
          city: dto.city,
          location: dto.location,
          urgencyLevel: dto.urgencyLevel,
          preferredTime: dto.preferredTime ? new Date(dto.preferredTime) : undefined,
          vehicleType: dto.vehicleType
        },
        candidateCount: 0,
        recommendations: [],
        status: 'failed',
        errorMessage: `No active/approved providers found matching category "${dto.serviceCategory}" or fallback in "${dto.city}"`,
        modelType: configMode === 'ml_model' ? 'ml_model' : 'rule_based',
        modelVersion: 'v1'
      });

      const savedLog = await logDoc.save();

      return {
        recommendationId: savedLog._id.toString(),
        criteria: {
          ...dto,
          isFallbackUsed: false,
          status: 'failed'
        },
        recommendations: [],
        timestamp: (savedLog as any).createdAt || new Date(),
        modelType: logDoc.modelType,
        modelVersion: logDoc.modelVersion,
        confidence: 0.0,
        reasons: ['لم يتم العثور على أي مزودي خدمة متوفرين'],
        rankedProviders: []
      } as any;
    }

    // 4. Fetch metrics for candidate providers with Cache fallback
    const providerIds = providers.map(p => (p as any)._id || (p as any).id);
    const metricsMap = new Map<string, any>();
    const missingProviderIds: Types.ObjectId[] = [];

    for (const providerId of providerIds) {
      const pIdStr = providerId.toString();
      const metricsCacheKey = `provider_metrics:${pIdStr}`;
      try {
        const cachedMetrics = await this.cacheManager.get<any>(metricsCacheKey);
        if (cachedMetrics) {
          metricsMap.set(pIdStr, cachedMetrics);
        } else {
          missingProviderIds.push(providerId);
        }
      } catch (cacheErr) {
        missingProviderIds.push(providerId);
      }
    }

    if (missingProviderIds.length > 0) {
      this.logger.log(`[Cache Miss] Fetching metrics for ${missingProviderIds.length} providers from MongoDB...`);
      const fetchedMetrics = await this.metricsModel.find({ provider: { $in: missingProviderIds } }).exec();
      
      for (const metrics of fetchedMetrics) {
        const pIdStr = metrics.provider.toString();
        metricsMap.set(pIdStr, metrics);
        const metricsCacheKey = `provider_metrics:${pIdStr}`;
        try {
          // Convert Mongoose document to plain object to avoid circular db references
          await this.cacheManager.set(metricsCacheKey, metrics.toObject ? metrics.toObject() : metrics, 60000);
        } catch (cacheErr) {
          this.logger.warn(`Failed to write metrics to cache for provider ${pIdStr}: ${cacheErr.message}`);
        }
      }
    }

    // 4. Determine Mode & Execute Recommendation
    const configMode = (process.env.AI_RECOMMENDATION_MODE || 'rule_based').toLowerCase();
    let result: any;
    let usedMode = configMode;

    if (configMode === 'ml_model') {
      try {
        result = await this.mlModelProvider.recommend(dto, providers, metricsMap);
      } catch (err) {
        this.logger.warn(`ML Recommendation inference failed, falling back to Rule-Based engine. Reason: ${err.message}`);
        result = await this.ruleBasedProvider.recommend(dto, providers, metricsMap);
        usedMode = 'rule_based';
      }
    } else {
      result = await this.ruleBasedProvider.recommend(dto, providers, metricsMap);
    }

    const { modelType, modelVersion, confidence, reasons, rankedProviders } = result;

    // 5. Apply Epsilon-Greedy Exploration (Equal Opportunity System)
    // 5% chance (Epsilon = 0.05) to inject a new/emerging provider for fair market distribution
    const EPSILON = 0.05;
    const shouldExplore = Math.random() < EPSILON;

    if (shouldExplore && providers.length > rankedProviders.length) {
      const rankedIds = new Set(rankedProviders.map(p => p.providerId));
      const emergingCandidates = providers.filter(p => {
        const pIdStr = (p as any)._id?.toString() || (p as any).id?.toString();
        if (rankedIds.has(pIdStr)) return false;

        const metrics = metricsMap.get(pIdStr);
        const completedOrders = metrics?.completedOrders ?? 0;
        const totalReviews = p.totalReviews ?? 0;

        // Emerging criteria: <= 5 completed orders OR <= 3 reviews
        return completedOrders <= 5 || totalReviews <= 3;
      });

      if (emergingCandidates.length > 0) {
        // Pick one emerging provider randomly
        const randomEmerging = emergingCandidates[Math.floor(Math.random() * emergingCandidates.length)];
        const p = randomEmerging as any;
        const pIdStr = p._id.toString();
        
        // Calculate scoring metrics for this provider
        const providerMetrics = metricsMap.get(pIdStr);
        const scoringResult = this.scoringService.scoreProvider(
          p,
          dto.location.lat,
          dto.location.lng,
          dto.urgencyLevel,
          dto.city,
          dto.serviceCategory,
          dto.preferredTime,
          providerMetrics
        );

        const exploredResult = {
          provider: p,
          providerId: pIdStr,
          providerName: p.businessName,
          phone: p.phone,
          logo: p.logo,
          category: p.category,
          averageRating: p.averageRating || 0,
          totalReviews: p.totalReviews || 0,
          score: 80.0, // Boosted explore score
          confidence: 0.75,
          scoringBreakdown: scoringResult.scoringBreakdown,
          reasons: [
            'ورشة جديدة صاعدة - فرصة لتجربة الخدمة وتقييمها المباشر لتشجيع المزودين الجدد',
            ...scoringResult.reasons.slice(0, 1)
          ],
          isExploration: true
        };

        // Replace the recommended item (index 0) with the explored one
        if (rankedProviders.length > 0) {
          const replaceIndex = 0;
          rankedProviders[replaceIndex] = exploredResult;
          this.logger.log(`[Exploration] Injected emerging provider "${p.businessName}" (${pIdStr}) at index ${replaceIndex} for equal opportunity.`);
        }
      }
    }

    // 6. Map to response item DTOs (keeping recommendations compatible)
    const recommendations = rankedProviders.map(item => {
      return {
        providerId: item.providerId,
        providerName: item.providerName,
        phone: item.phone,
        logo: item.logo,
        category: item.category,
        averageRating: item.averageRating || 0,
        totalReviews: item.totalReviews || 0,
        score: item.score,
        confidence: item.confidence,
        scoringBreakdown: item.scoringBreakdown,
        reasons: item.reasons,
        isExploration: (item as any).isExploration || false
      };
    });

    // 7. Create log entry in DB (Success Scenario - suitable for future ML training models)
    const logDoc = new this.logModel({
      user: userId ? new Types.ObjectId(userId) : undefined,
      criteria: {
        serviceCategory: dto.serviceCategory,
        city: dto.city,
        location: dto.location,
        urgencyLevel: dto.urgencyLevel,
        preferredTime: dto.preferredTime ? new Date(dto.preferredTime) : undefined,
        vehicleType: dto.vehicleType
      },
      candidateCount,
      recommendations: rankedProviders.map(item => ({
        provider: (item.provider as any)._id,
        score: item.score,
        distanceKm: item.scoringBreakdown?.distance ? parseFloat((item.scoringBreakdown.distance * 50.0).toFixed(2)) : 10.0,
        confidence: item.confidence,
        scoresBreakdown: item.scoringBreakdown,
        reasons: item.reasons,
        isExploration: (item as any).isExploration || false
      })),
      status: 'success',
      modelType: usedMode,
      modelVersion
    });

    const savedLog = await logDoc.save();

    // 7. Format API response including both backward-compatible and new fields
    const response: RecommendationResponseDto = {
      recommendationId: savedLog._id.toString(),
      criteria: {
        ...dto,
        isFallbackUsed
      },
      recommendations,
      timestamp: (savedLog as any).createdAt || new Date(),
      modelType,
      modelVersion,
      confidence,
      reasons,
      rankedProviders: recommendations
    } as any;

    // Cache the successful recommendation result for 60 seconds
    if (logDoc.status === 'success') {
      try {
        await this.cacheManager.set(cacheKey, response, 60000);
        this.logger.log(`[Cache Set] Cached recommendation results for key: ${cacheKey}`);
      } catch (cacheErr) {
        this.logger.warn(`Failed to write recommendation results to cache: ${cacheErr.message}`);
      }
    }

    return response;
  }

  /**
   * Find active & approved providers matching serviceCategory and city
   */
  private async fetchProviders(category: string, city: string, excludeIds?: string[]): Promise<Provider[]> {
    const query: any = {
      isActive: true,
      isApproved: true,
      $or: [
        { category: { $regex: new RegExp(category, 'i') } },
        { serviceCategories: { $in: [category] } }
      ]
    };

    if (city) {
      query.city = { $regex: new RegExp(city, 'i') };
    }

    if (excludeIds && excludeIds.length > 0) {
      const objectIds = excludeIds.map(id => {
        try {
          return new Types.ObjectId(id);
        } catch (e) {
          return null;
        }
      }).filter(id => id !== null);
      if (objectIds.length > 0) {
        query._id = { $nin: objectIds };
      }
    }

    return this.providerModel.find(query).exec();
  }

  /**
   * Fallback query to find any active & approved providers in the city
   */
  private async fetchProvidersFallback(city: string, excludeIds?: string[]): Promise<Provider[]> {
    const query: any = {
      isActive: true,
      isApproved: true
    };

    if (city) {
      query.city = { $regex: new RegExp(city, 'i') };
    }

    if (excludeIds && excludeIds.length > 0) {
      const objectIds = excludeIds.map(id => {
        try {
          return new Types.ObjectId(id);
        } catch (e) {
          return null;
        }
      }).filter(id => id !== null);
      if (objectIds.length > 0) {
        query._id = { $nin: objectIds };
      }
    }

    return this.providerModel.find(query).exec();
  }
}
