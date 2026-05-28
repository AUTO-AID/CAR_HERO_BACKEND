import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Provider, ProviderSchema } from '../providers/infrastructure/persistence/mongoose/schemas/provider.schema';
import { AiRecommendationLog, AiRecommendationLogSchema } from './schemas/ai-recommendation-log.schema';
import { ProviderMetrics, ProviderMetricsSchema } from './schemas/provider-metrics.schema';
import { Order, OrderSchema } from '../orders/infrastructure/persistence/mongoose/schemas/order.schema';
import { Review, ReviewSchema } from '../reviews/infrastructure/persistence/mongoose/schemas/review.schema';
import { Service, ServiceSchema } from '../services/infrastructure/persistence/mongoose/schemas/service.schema';
import { ProviderScoringService } from './provider-scoring.service';
import { ProviderMetricsService } from './provider-metrics.service';
import { AiRecommendationService } from './ai-recommendation.service';
import { AiRecommendationController } from './ai-recommendation.controller';
import { AiAnalyticsController } from './ai-analytics.controller';
import { AiAnalyticsService } from './ai-analytics.service';
import { RuleBasedRecommendationProvider } from './providers/rule-based.provider';
import { MlRecommendationProvider } from './providers/ml-model.provider';
import { ModelRetrainingService } from './model-retraining.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Provider.name, schema: ProviderSchema },
      { name: AiRecommendationLog.name, schema: AiRecommendationLogSchema },
      { name: ProviderMetrics.name, schema: ProviderMetricsSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: Service.name, schema: ServiceSchema },
    ]),
  ],
  controllers: [AiRecommendationController, AiAnalyticsController],
  providers: [
    ProviderScoringService,
    ProviderMetricsService,
    RuleBasedRecommendationProvider,
    MlRecommendationProvider,
    AiRecommendationService,
    AiAnalyticsService,
    ModelRetrainingService
  ],
  exports: [
    ProviderScoringService,
    ProviderMetricsService,
    RuleBasedRecommendationProvider,
    MlRecommendationProvider,
    AiRecommendationService,
    ModelRetrainingService
  ],
})
export class AiRecommendationModule {}
