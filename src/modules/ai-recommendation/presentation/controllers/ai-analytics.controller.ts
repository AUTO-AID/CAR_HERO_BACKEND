import { Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Permissions, Roles } from '../../../../core/decorators';
import { Role } from '../../../../core/enums/roles.enum';
import { JwtAuthGuard, PermissionsGuard, RolesGuard } from '../../../../core/guards';
import { AiAnalyticsService } from '../../application/services/ai-analytics.service';
import type { AiAnalyticsFilters } from '../../application/services/ai-analytics.service';
import { ModelRetrainingService } from '../../application/services/model-retraining.service';

@ApiTags('Admin AI Recommendations Analytics')
@Controller('admin/ai-recommendations')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN)
@Permissions('analytics.read')
@ApiBearerAuth('JWT-auth')
export class AiAnalyticsController {
  constructor(
    private readonly analyticsService: AiAnalyticsService,
    private readonly retrainingService: ModelRetrainingService,
  ) {}

  @Get('summary')
  getSummary(@Query() filters: AiAnalyticsFilters) { return this.analyticsService.getSummary(filters); }

  @Get('top-providers')
  getTopProviders(@Query() filters: AiAnalyticsFilters, @Query('limit') limit?: string) {
    return this.analyticsService.getTopProviders(filters, Number(limit) || 10);
  }

  @Get('service-performance')
  getServicePerformance(@Query() filters: AiAnalyticsFilters) { return this.analyticsService.getServicePerformance(filters); }

  @Get('city-performance')
  getCityPerformance(@Query() filters: AiAnalyticsFilters) { return this.analyticsService.getCityPerformance(filters); }

  @Get('filters')
  getFilters() { return this.analyticsService.getFilters(); }

  @Get('logs')
  getLogs(@Query() filters: AiAnalyticsFilters) { return this.analyticsService.getLogs(filters); }

  @Get('export')
  @ApiOperation({ summary: 'Export filtered AI recommendation logs as CSV' })
  async exportCsv(@Query() filters: AiAnalyticsFilters, @Res() response: Response) {
    const csv = await this.analyticsService.exportCsv(filters);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', 'attachment; filename="ai-recommendations.csv"');
    response.send(`\uFEFF${csv}`);
  }

  @Post('retrain')
  @ApiOperation({ summary: 'Manually trigger AI model retraining and hot-reload' })
  retrainModel() { return this.retrainingService.retrainModel(); }
}
