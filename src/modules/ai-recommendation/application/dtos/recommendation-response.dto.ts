import { ApiProperty } from '@nestjs/swagger';

export class ScoringBreakdownDto {
  @ApiProperty({ example: 0.95, description: 'Normalized score for distance (0-1)' })
  distance: number;

  @ApiProperty({ example: 0.88, description: 'Normalized score for rating (0-1)' })
  rating: number;

  @ApiProperty({ example: 1.0, description: 'Normalized score for service match (0-1)' })
  serviceMatch: number;

  @ApiProperty({ example: 0.9, description: 'Normalized score for working hours (0-1)' })
  workingHours: number;

  @ApiProperty({ example: 1.0, description: 'Normalized score for emergency support (0-1)' })
  emergencySupport: number;

  @ApiProperty({ example: 0.85, description: 'Normalized score for expected response time (0-1)' })
  expectedResponseTime: number;

  @ApiProperty({ example: 0.75, description: 'Normalized score for completed orders volume (0-1)' })
  completedOrders: number;

  @ApiProperty({ example: 0.95, description: 'Normalized score for low cancellation rate (0-1)' })
  cancellationRate: number;

  @ApiProperty({ example: 1.0, description: 'Normalized score for city match (0-1)' })
  cityMatch: number;

  @ApiProperty({ example: 1.0, description: 'Normalized score for urgency alignment (0-1)' })
  urgencyAlignment: number;
}

export class RecommendedProviderItemDto {
  @ApiProperty({ example: '60b8d295f1d293001f3e4c8b', description: 'Provider document ID' })
  providerId: string;

  @ApiProperty({ example: 'Al-Amal Workshop', description: 'Name of the workshop/business' })
  providerName: string;

  @ApiProperty({ example: '+963991112222', description: 'Contact phone number' })
  phone: string;

  @ApiProperty({ example: 'http://example.com/logo.png', description: 'Logo image URL' })
  logo?: string;

  @ApiProperty({ example: 'Mechanical', description: 'Primary category of the provider' })
  category?: string;

  @ApiProperty({ example: 4.8, description: 'Average rating' })
  averageRating: number;

  @ApiProperty({ example: 124, description: 'Total reviews count' })
  totalReviews: number;

  @ApiProperty({ example: 92.5, description: 'Overall weighted recommendation score (0-100)' })
  score: number;

  @ApiProperty({ example: 0.86, description: 'Model confidence score (0-1)' })
  confidence: number;

  @ApiProperty({ type: ScoringBreakdownDto, description: 'Normalized scores breakdown for all 10 criteria' })
  scoringBreakdown: ScoringBreakdownDto;

  @ApiProperty({ example: ['قريب جداً من موقعك الحالي', 'تقييمه ممتاز'], description: 'Reasons for recommendation in Arabic' })
  reasons: string[];

  @ApiProperty({ example: false, description: 'Whether this provider was injected as part of random exploration', required: false })
  isExploration?: boolean;
}

export class RecommendationResponseDto {
  @ApiProperty({ example: '60b8d295f1d293001f3e4c8a', description: 'Unique log ID for this recommendation' })
  recommendationId: string;

  @ApiProperty({ description: 'Criteria used for this recommendation request' })
  criteria: any;

  @ApiProperty({ type: [RecommendedProviderItemDto], description: 'Sorted list of recommended providers' })
  recommendations: RecommendedProviderItemDto[];

  @ApiProperty({ example: '2026-05-26T22:30:00Z', description: 'Timestamp of execution' })
  timestamp: Date;

  @ApiProperty({ example: 'ml_model', description: 'Recommendation model type used (rule_based or ml_model)' })
  modelType: string;

  @ApiProperty({ example: 'v1', description: 'Model version' })
  modelVersion: string;

  @ApiProperty({ example: 0.86, description: 'Model confidence score (0-1)' })
  confidence: number;

  @ApiProperty({ example: ['قريب جداً من موقعك الحالي'], description: 'Reasons for overall recommendation' })
  reasons: string[];

  @ApiProperty({ type: [RecommendedProviderItemDto], description: 'Ranked list of providers' })
  rankedProviders: RecommendedProviderItemDto[];
}
