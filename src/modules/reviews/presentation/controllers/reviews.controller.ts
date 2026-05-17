import { Controller, Post, Body, UseGuards, HttpStatus, HttpCode, Get, Query, Param, Patch, Delete, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CreateReviewUseCase } from '../../application/use-cases/create-review.use-case';
import { GetProviderReviewsUseCase } from '../../application/use-cases/get-provider-reviews.use-case';
import { RespondToReviewUseCase } from '../../application/use-cases/respond-to-review.use-case';
import { DeleteReviewUseCase } from '../../application/use-cases/delete-review.use-case';
import { CreateReviewDto, ProviderResponseDto, ReviewQueryDto } from '../dtos/review.dto';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly createReviewUseCase: CreateReviewUseCase,
    private readonly getProviderReviewsUseCase: GetProviderReviewsUseCase,
    private readonly respondToReviewUseCase: RespondToReviewUseCase,
    private readonly deleteReviewUseCase: DeleteReviewUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new review for an order' })
  async createReview(@Body() dto: CreateReviewDto, @Req() req: any) {
    return this.createReviewUseCase.execute(dto, req.user);
  }

  @Get('provider/:providerId')
  @ApiOperation({ summary: 'Get all reviews for a specific provider' })
  async getProviderReviews(
    @Param('providerId') providerId: string,
    @Query() query: ReviewQueryDto,
  ) {
    return this.getProviderReviewsUseCase.execute(providerId, query.page, query.limit);
  }

  @Patch(':id/respond')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Provider response to a review' })
  async respondToReview(
    @Param('id') id: string,
    @Body() dto: ProviderResponseDto,
    @Req() req: any,
  ) {
    return this.respondToReviewUseCase.execute(id, dto.response, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a review' })
  async deleteReview(@Param('id') id: string, @Req() req: any) {
    return this.deleteReviewUseCase.execute(id, req.user);
  }
}
