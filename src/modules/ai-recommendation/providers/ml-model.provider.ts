import { Injectable, Logger } from '@nestjs/common';
import { RecommendationModelProvider, RecommendationProviderResponse, ScoredProviderResult } from '../interfaces/recommendation-provider.interface';
import { RecommendProviderDto } from '../dtos/recommend-provider.dto';
import { Provider } from '../../providers/infrastructure/persistence/mongoose/schemas/provider.schema';
import { ProviderScoringService } from '../provider-scoring.service';
import axios from 'axios';

@Injectable()
export class MlRecommendationProvider implements RecommendationModelProvider {
  private readonly logger = new Logger(MlRecommendationProvider.name);
  
  constructor(private readonly scoringService: ProviderScoringService) {}

  async recommend(
    dto: RecommendProviderDto,
    providers: Provider[],
    metricsMap: Map<string, any>
  ): Promise<RecommendationProviderResponse> {
    this.logger.log(`Invoking ML Recommendation Provider for ${providers.length} candidates.`);

    // 1. Calculate traditional features and structure them for ML model input
    const candidatesWithFeatures = providers.map(provider => {
      const providerMetrics = metricsMap.get((provider as any)._id?.toString() || (provider as any).id?.toString());
      const scoringResult = this.scoringService.scoreProvider(
        provider,
        dto.location.lat,
        dto.location.lng,
        dto.urgencyLevel,
        dto.city,
        dto.serviceCategory,
        dto.preferredTime,
        providerMetrics
      );

      const p = provider as any;
      const breakdown = scoringResult.scoringBreakdown;
      
      return {
        provider,
        providerId: p._id.toString(),
        providerName: p.businessName,
        phone: p.phone,
        logo: p.logo,
        category: p.category,
        averageRating: p.averageRating || 0,
        totalReviews: p.totalReviews || 0,
        scoringBreakdown: breakdown,
        reasons: scoringResult.reasons,
        confidence: scoringResult.confidence,
        // Features input keys matching predict.py expectations
        features: {
          providerId: p._id.toString(),
          distance: breakdown.distance,
          rating: breakdown.rating,
          serviceMatch: breakdown.serviceMatch,
          workingHours: breakdown.workingHours,
          emergencySupport: breakdown.emergencySupport,
          expectedResponseTime: breakdown.expectedResponseTime,
          completedOrders: breakdown.completedOrders,
          cancellationRate: breakdown.cancellationRate,
          cityMatch: breakdown.cityMatch,
          urgencyAlignment: breakdown.urgencyAlignment
        }
      };
    });

    // 2. Call FastAPI Inference Service to run predictions using loaded RandomForest model
    const inputFeatures = candidatesWithFeatures.map(c => c.features);
    const predictions = await this.callFastApiPrediction(inputFeatures);

    // 3. Map predicted scores back to candidates list
    const predictionsMap = new Map<string, number>(
      predictions.map((p: any) => [p.providerId, p.score])
    );

    const scoredList: ScoredProviderResult[] = candidatesWithFeatures.map(item => {
      const mlScore = predictionsMap.get(item.providerId) ?? 50.0; // Fallback score if missing
      return {
        provider: item.provider,
        providerId: item.providerId,
        providerName: item.providerName,
        phone: item.phone,
        logo: item.logo,
        category: item.category,
        averageRating: item.averageRating,
        totalReviews: item.totalReviews,
        score: mlScore,
        confidence: item.confidence,
        scoringBreakdown: item.scoringBreakdown,
        reasons: item.reasons
      };
    });

    // Sort by predicted score descending
    scoredList.sort((a, b) => b.score - a.score);

    // Limit to top 1
    const rankedProviders = scoredList.slice(0, 1);

    const topItem = rankedProviders[0];
    const confidence = topItem ? topItem.confidence : 0.0;
    const reasons = topItem ? topItem.reasons : ['يطابق المعايير الذكية لنموذج التعلم الآلي'];

    return {
      modelType: 'ml_model',
      modelVersion: 'v1',
      confidence,
      reasons,
      rankedProviders
    };
  }

  /**
   * Helper function calling the FastAPI independent inference service to predict scores
   */
  private async callFastApiPrediction(candidatesData: any[]): Promise<any[]> {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const predictUrl = `${aiServiceUrl}/predict`;
    
    try {
      this.logger.log(`Sending request to FastAPI service at ${predictUrl} with ${candidatesData.length} candidates.`);
      
      const response = await axios.post(predictUrl, {
        candidates: candidatesData
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 2000 // 2 seconds timeout
      });

      if (response.data && Array.isArray(response.data.predictions)) {
        return response.data.predictions;
      }
      
      throw new Error('Invalid response structure received from FastAPI inference service.');
    } catch (error) {
      const errMsg = error.response?.data?.detail || error.message;
      this.logger.error(`Failed to predict via FastAPI service: ${errMsg}`);
      throw new Error(`FastAPI Prediction failed: ${errMsg}`);
    }
  }
}
