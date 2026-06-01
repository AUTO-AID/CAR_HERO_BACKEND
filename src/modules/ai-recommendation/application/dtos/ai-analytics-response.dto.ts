import { ApiProperty } from '@nestjs/swagger';

export class ModelTypeDistributionItem {
  @ApiProperty({ example: 'ml_model', description: 'AI recommendation model type (e.g. ml_model, rule_based)' })
  modelType: string;

  @ApiProperty({ example: 450, description: 'Number of recommendations generated using this model' })
  count: number;
}

export class DailyTrendItem {
  @ApiProperty({ example: '2026-05-26', description: 'Date in YYYY-MM-DD format' })
  date: string;

  @ApiProperty({ example: 25, description: 'Total recommendation requests on this day' })
  total: number;

  @ApiProperty({ example: 23, description: 'Successful recommendations' })
  success: number;

  @ApiProperty({ example: 2, description: 'Failed recommendations (fallback to rule-based or zero-results)' })
  failed: number;
}

export class ConfidenceTrendItem {
  @ApiProperty({ example: '2026-05-26', description: 'Date in YYYY-MM-DD format' })
  date: string;

  @ApiProperty({ example: 0.854, description: 'Average model confidence rating on this day (0 to 1)' })
  avgConfidence: number;
}

export class AiAnalyticsSummaryResponseDto {
  @ApiProperty({ example: 1250, description: 'Total AI recommendation logs generated' })
  totalRecommendations: number;

  @ApiProperty({ example: 1180, description: 'Total successfully matching recommendations' })
  successfulRecommendations: number;

  @ApiProperty({ example: 70, description: 'Total failed recommendations' })
  failedRecommendations: number;

  @ApiProperty({ example: 94.4, description: 'Overall recommendation success rate in percentage' })
  successRate: number;

  @ApiProperty({ example: 0.862, description: 'Average model confidence (0 to 1)' })
  averageConfidence: number;

  @ApiProperty({ example: 8.5, description: 'Average candidate count processed per recommendation' })
  averageCandidates: number;

  @ApiProperty({ type: [ModelTypeDistributionItem], description: 'Distribution of recommendation modes used' })
  modelTypeDistribution: ModelTypeDistributionItem[];

  @ApiProperty({ type: [DailyTrendItem], description: 'Daily trend statistics for the last 30 days' })
  dailyTrend: DailyTrendItem[];

  @ApiProperty({ type: [ConfidenceTrendItem], description: 'Daily average confidence level trend for the last 30 days' })
  confidenceTrend: ConfidenceTrendItem[];
}

export class TopRecommendedProviderItemDto {
  @ApiProperty({ example: '60b8d295f1d293001f3e4c8b', description: 'Unique Provider ID' })
  providerId: string;

  @ApiProperty({ example: 'ورشة الوفاء الممتازة', description: 'Business Name' })
  businessName: string;

  @ApiProperty({ example: 'towing', description: 'Primary service category' })
  category: string;

  @ApiProperty({ example: 'Damascus', description: 'City location' })
  city: string;

  @ApiProperty({ example: 85, description: 'Number of times this provider was recommended' })
  recommendationCount: number;

  @ApiProperty({ example: 94.2, description: 'Average calculated recommendation match score (0-100)' })
  avgScore: number;

  @ApiProperty({ example: 0.875, description: 'Average model confidence for this provider (0-1)' })
  avgConfidence: number;

  @ApiProperty({ example: 8.4, description: 'Average recommended distance in kilometers' })
  avgDistance: number;
}

export class TopProvidersResponseDto {
  @ApiProperty({ type: [TopRecommendedProviderItemDto], description: 'List of top recommended providers' })
  topProviders: TopRecommendedProviderItemDto[];
}

export class ServicePerformanceItemDto {
  @ApiProperty({ example: 'towing', description: 'Service category' })
  serviceCategory: string;

  @ApiProperty({ example: 340, description: 'Total recommendation requests for this category' })
  totalRequests: number;

  @ApiProperty({ example: 325, description: 'Successful matches' })
  successRequests: number;

  @ApiProperty({ example: 15, description: 'Failed matches' })
  failedRequests: number;

  @ApiProperty({ example: 95.59, description: 'Success rate in percentage' })
  successRate: number;

  @ApiProperty({ example: 5.4, description: 'Average candidate count' })
  avgCandidates: number;

  @ApiProperty({ example: 0.882, description: 'Average model confidence score (0-1)' })
  avgConfidence: number;

  @ApiProperty({ example: 91.2, description: 'Average matching score (0-100)' })
  avgScore: number;
}

export class ServicePerformanceResponseDto {
  @ApiProperty({ type: [ServicePerformanceItemDto], description: 'Service performance statistics list' })
  servicePerformance: ServicePerformanceItemDto[];
}

export class CityPerformanceItemDto {
  @ApiProperty({ example: 'Damascus', description: 'City name' })
  city: string;

  @ApiProperty({ example: 450, description: 'Total recommendation requests in this city' })
  totalRequests: number;

  @ApiProperty({ example: 430, description: 'Successful matches' })
  successRequests: number;

  @ApiProperty({ example: 20, description: 'Failed matches' })
  failedRequests: number;

  @ApiProperty({ example: 95.56, description: 'Success rate in percentage' })
  successRate: number;

  @ApiProperty({ example: 12.6, description: 'Average candidate count' })
  avgCandidates: number;

  @ApiProperty({ example: 0.856, description: 'Average model confidence score (0-1)' })
  avgConfidence: number;

  @ApiProperty({ example: 89.5, description: 'Average matching score (0-100)' })
  avgScore: number;
}

export class CityPerformanceResponseDto {
  @ApiProperty({ type: [CityPerformanceItemDto], description: 'City performance statistics list' })
  cityPerformance: CityPerformanceItemDto[];
}
