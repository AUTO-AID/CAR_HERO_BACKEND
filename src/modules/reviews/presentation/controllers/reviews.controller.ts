import { Controller, Post, Body, UseGuards, HttpStatus, HttpCode, Get, Query, Param, Patch, Delete, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CreateReviewUseCase } from '../../application/use-cases/create-review.use-case';
import { GetProviderReviewsUseCase } from '../../application/use-cases/get-provider-reviews.use-case';
import { RespondToReviewUseCase } from '../../application/use-cases/respond-to-review.use-case';
import { DeleteReviewUseCase } from '../../application/use-cases/delete-review.use-case';
import { CreateReviewDto, ProviderResponseDto, ReviewQueryDto } from '../dtos/review.dto';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review, ReviewDocument } from '../../infrastructure/persistence/mongoose/schemas/review.schema';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly createReviewUseCase: CreateReviewUseCase,
    private readonly getProviderReviewsUseCase: GetProviderReviewsUseCase,
    private readonly respondToReviewUseCase: RespondToReviewUseCase,
    private readonly deleteReviewUseCase: DeleteReviewUseCase,
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all reviews with filters for admin' })
  async getReviews(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('isReported') isReported?: string,
    @Query('isVisible') isVisible?: string,
  ) {
    const query: any = {};
    if (isReported !== undefined) {
      query.isReported = isReported === 'true' || isReported === '1';
    }
    if (isVisible !== undefined) {
      query.isVisible = isVisible === 'true' || isVisible === '1';
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [docs, total] = await Promise.all([
      this.reviewModel.find(query)
        .populate('user')
        .populate('provider')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .exec(),
      this.reviewModel.countDocuments(query),
    ]);

    return {
      success: true,
      data: {
        reviews: docs,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
        }
      }
    };
  }

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
