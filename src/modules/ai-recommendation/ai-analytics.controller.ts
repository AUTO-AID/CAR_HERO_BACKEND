import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { AiAnalyticsService } from './ai-analytics.service';
import { ModelRetrainingService } from './model-retraining.service';
import {
  AiAnalyticsSummaryResponseDto,
  TopProvidersResponseDto,
  ServicePerformanceResponseDto,
  CityPerformanceResponseDto,
} from './dtos/ai-analytics-response.dto';

@ApiTags('Admin AI Recommendations Analytics')
@Controller('admin/ai-recommendations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AiAnalyticsController {
  constructor(
    private readonly analyticsService: AiAnalyticsService,
    private readonly retrainingService: ModelRetrainingService,
  ) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get overall AI recommendation summary statistics' })
  @ApiResponse({ status: 200, type: AiAnalyticsSummaryResponseDto, description: 'Summary analytics returned successfully' })
  async getSummary(): Promise<AiAnalyticsSummaryResponseDto> {
    return this.analyticsService.getSummary() as any;
  }

  @Get('top-providers')
  @ApiOperation({ summary: 'Get top recommended providers ranked by recommendation frequency' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of top providers to return (default: 10)' })
  @ApiResponse({ status: 200, type: TopProvidersResponseDto, description: 'Top providers list returned successfully' })
  async getTopProviders(@Query('limit') limit?: string): Promise<TopProvidersResponseDto> {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.analyticsService.getTopProviders(parsedLimit) as any;
  }

  @Get('service-performance')
  @ApiOperation({ summary: 'Get recommendation performance analytics grouped by service category' })
  @ApiResponse({ status: 200, type: ServicePerformanceResponseDto, description: 'Service performance analytics returned successfully' })
  async getServicePerformance(): Promise<ServicePerformanceResponseDto> {
    return this.analyticsService.getServicePerformance() as any;
  }

  @Get('city-performance')
  @ApiOperation({ summary: 'Get recommendation performance analytics grouped by city' })
  @ApiResponse({ status: 200, type: CityPerformanceResponseDto, description: 'City performance analytics returned successfully' })
  async getCityPerformance(): Promise<CityPerformanceResponseDto> {
    return this.analyticsService.getCityPerformance() as any;
  }

  @Post('retrain')
  @ApiOperation({ summary: 'Manually trigger AI recommendation model retraining and hot-reload' })
  @ApiResponse({ status: 200, description: 'Model retrained and reloaded successfully' })
  async retrainModel() {
    return this.retrainingService.retrainModel();
  }
}
