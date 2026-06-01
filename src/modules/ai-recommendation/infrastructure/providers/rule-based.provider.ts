import { Injectable } from '@nestjs/common';
import { RecommendationModelProvider, RecommendationProviderResponse } from '../../application/interfaces/recommendation-provider.interface';
import { RecommendProviderDto } from '../../application/dtos/recommend-provider.dto';
import { Provider } from '../../../providers/infrastructure/persistence/mongoose/schemas/provider.schema';
import { ProviderScoringService } from '../../application/services/provider-scoring.service';

@Injectable()
export class RuleBasedRecommendationProvider implements RecommendationModelProvider {
  constructor(private readonly scoringService: ProviderScoringService) {}

  async recommend(
    dto: RecommendProviderDto,
    providers: Provider[],
    metricsMap: Map<string, any>
  ): Promise<RecommendationProviderResponse> {
    const scoredList = providers.map(provider => {
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
      return {
        provider,
        providerId: p._id.toString(),
        providerName: p.businessName,
        phone: p.phone,
        logo: p.logo,
        category: p.category,
        averageRating: p.averageRating || 0,
        totalReviews: p.totalReviews || 0,
        score: scoringResult.score,
        confidence: scoringResult.confidence,
        scoringBreakdown: scoringResult.scoringBreakdown,
        reasons: scoringResult.reasons
      };
    });

    // Sort by score descending
    scoredList.sort((a, b) => b.score - a.score);

    // Limit to top 1
    const rankedProviders = scoredList.slice(0, 1);

    // Calculate top-level values
    const topItem = rankedProviders[0];
    const confidence = topItem ? topItem.confidence : 0.0;
    const reasons = topItem ? topItem.reasons : ['لا توجد مبررات كافية حالياً'];

    return {
      modelType: 'rule_based',
      modelVersion: 'v1',
      confidence,
      reasons,
      rankedProviders
    };
  }
}
