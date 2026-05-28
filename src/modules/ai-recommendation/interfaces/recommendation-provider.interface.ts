import { RecommendProviderDto } from '../dtos/recommend-provider.dto';
import { Provider } from '../../providers/infrastructure/persistence/mongoose/schemas/provider.schema';

export interface ScoredProviderResult {
  provider: Provider;
  providerId: string;
  providerName: string;
  score: number;
  confidence: number;
  scoringBreakdown: any;
  reasons: string[];
  phone?: string;
  logo?: string;
  category?: string;
  averageRating?: number;
  totalReviews?: number;
}

export interface RecommendationProviderResponse {
  modelType: string;
  modelVersion: string;
  confidence: number;
  reasons: string[];
  rankedProviders: ScoredProviderResult[];
}

export interface RecommendationModelProvider {
  recommend(
    dto: RecommendProviderDto,
    providers: Provider[],
    metricsMap: Map<string, any>
  ): Promise<RecommendationProviderResponse>;
}
