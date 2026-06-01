import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Provider, ProviderSchema } from '../providers/infrastructure/persistence/mongoose/schemas/provider.schema';
import { AiRecommendationLog, AiRecommendationLogSchema } from './infrastructure/schemas/ai-recommendation-log.schema';
import { ProviderMetrics, ProviderMetricsSchema } from './infrastructure/schemas/provider-metrics.schema';
import { Order, OrderSchema } from '../orders/infrastructure/persistence/mongoose/schemas/order.schema';
import { Review, ReviewSchema } from '../reviews/infrastructure/persistence/mongoose/schemas/review.schema';
import { Service, ServiceSchema } from '../services/infrastructure/persistence/mongoose/schemas/service.schema';
import { ProviderScoringService } from './application/services/provider-scoring.service';
import { ProviderMetricsService } from './application/services/provider-metrics.service';
import { AiRecommendationService } from './application/services/ai-recommendation.service';
import { AiRecommendationController } from './presentation/controllers/ai-recommendation.controller';
import { AiAnalyticsController } from './presentation/controllers/ai-analytics.controller';
import { AiAnalyticsService } from './application/services/ai-analytics.service';
import { RuleBasedRecommendationProvider } from './infrastructure/providers/rule-based.provider';
import { MlRecommendationProvider } from './infrastructure/providers/ml-model.provider';
import { ModelRetrainingService } from './application/services/model-retraining.service';

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
