import { Controller, Post, Body, UseGuards, Req, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { AiRecommendationService } from './ai-recommendation.service';
import { RecommendProviderDto } from './dtos/recommend-provider.dto';
import { RecommendationResponseDto } from './dtos/recommendation-response.dto';

@ApiTags('AI Recommendation')
@Controller('ai')
export class AiRecommendationController {
  constructor(private readonly recommendationService: AiRecommendationService) {}

  @Post('recommend-provider')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get smart recommendations for service providers based on distance, ratings, availability, and performance' })
  @ApiResponse({ status: 200, type: RecommendationResponseDto, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async getRecommendation(
    @Body() recommendProviderDto: RecommendProviderDto,
    @Req() req: any
  ): Promise<RecommendationResponseDto> {
    const userId = req.user?._id;
    return this.recommendationService.recommend(recommendProviderDto, userId);
  }
}
