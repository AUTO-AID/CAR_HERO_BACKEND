import { Controller, Post, Body, UseGuards, HttpStatus, HttpCode, Get, Query, Param, Patch, Delete, Req, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CreateReviewUseCase } from '../../application/use-cases/create-review.use-case';
import { GetProviderReviewsUseCase } from '../../application/use-cases/get-provider-reviews.use-case';
import { RespondToReviewUseCase } from '../../application/use-cases/respond-to-review.use-case';
import { DeleteReviewUseCase } from '../../application/use-cases/delete-review.use-case';
import { CreateReviewDto, ProviderResponseDto, ReviewQueryDto } from '../dtos/review.dto';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { Roles } from '../../../../core/decorators/roles.decorator';
import { Role } from '../../../../core/enums/roles.enum';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all reviews with filters for admin' })
  async getReviews(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('isReported') isReported?: string,
    @Query('isVisible') isVisible?: string,
    @Query('rating') rating?: string,
    @Query('hasResponse') hasResponse?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 10));
    const query: any = {};
    if (isReported !== undefined) {
      query.isReported = isReported === 'true' || isReported === '1';
    }
    if (isVisible !== undefined) {
      query.isVisible = isVisible === 'true' || isVisible === '1';
    }
    if (rating && rating !== 'all') query.rating = Number(rating);
    if (hasResponse === 'true') query.$or = [{ providerResponse: { $exists: true, $nin: ['', null] } }, { 'response.comment': { $exists: true, $nin: ['', null] } }];
    if (hasResponse === 'false') query.$and = [{ $or: [{ providerResponse: { $exists: false } }, { providerResponse: { $in: ['', null] } }] }, { $or: [{ 'response.comment': { $exists: false } }, { 'response.comment': { $in: ['', null] } }] }];
    const sortField = ['createdAt', 'rating', 'helpfulCount'].includes(String(sortBy)) ? String(sortBy) : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const pipeline: any[] = [
      { $match: query },
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userDetails' } },
      { $lookup: { from: 'providers', localField: 'provider', foreignField: '_id', as: 'providerDetails' } },
      { $addFields: { user: { $first: '$userDetails' }, provider: { $first: '$providerDetails' } } },
    ];
    if (search) {
      const regex = new RegExp(this.escapeRegex(search.trim()), 'i');
      pipeline.push({ $match: { $or: [{ comment: regex }, { reportReason: regex }, { providerResponse: regex }, { 'user.fullName': regex }, { 'user.phoneNumber': regex }, { 'provider.businessName': regex }] } });
    }
    pipeline.push(
      { $sort: { [sortField]: sortDirection, _id: -1 } },
      { $facet: {
        reviews: [{ $skip: (safePage - 1) * safeLimit }, { $limit: safeLimit }, { $project: { userDetails: 0, providerDetails: 0, 'user.password': 0, 'user.refreshToken': 0 } }],
        meta: [{ $count: 'total' }],
      } },
    );
    const [result] = await this.reviewModel.aggregate(pipeline).exec();
    const total = result?.meta?.[0]?.total || 0;

    return {
      success: true,
      data: {
        reviews: result?.reviews || [],
        pagination: {
          total,
          page: safePage,
          limit: safeLimit,
          pages: Math.max(1, Math.ceil(total / safeLimit)),
        }
      }
    };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get review moderation and rating analytics' })
  async getReviewStats() {
    const [stats] = await this.reviewModel.aggregate([
      {
        $facet: {
          totals: [{ $group: { _id: null, total: { $sum: 1 }, averageRating: { $avg: '$rating' }, reported: { $sum: { $cond: ['$isReported', 1, 0] } }, hidden: { $sum: { $cond: ['$isVisible', 0, 1] } }, responded: { $sum: { $cond: [{ $or: [{ $gt: [{ $strLenCP: { $ifNull: ['$providerResponse', ''] } }, 0] }, { $gt: [{ $strLenCP: { $ifNull: ['$response.comment', ''] } }, 0] }] }, 1, 0] } } } }],
          ratings: [{ $group: { _id: '$rating', count: { $sum: 1 } } }, { $sort: { _id: 1 } }],
          timeline: [{ $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 }, averageRating: { $avg: '$rating' } } }, { $sort: { _id: 1 } }],
        },
      },
    ]).exec();
    const totals = stats?.totals?.[0] || { total: 0, averageRating: 0, reported: 0, hidden: 0, responded: 0 };
    return { success: true, data: { ...totals, ratingDistribution: stats?.ratings || [], timeline: stats?.timeline || [] } };
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

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update review moderation fields' })
  async updateReviewModeration(
    @Param('id') id: string,
    @Body() body: { isVisible?: boolean; isReported?: boolean },
  ) {
    const update: any = {};
    if (typeof body.isVisible === 'boolean') update.isVisible = body.isVisible;
    if (typeof body.isReported === 'boolean') update.isReported = body.isReported;

    const review = await this.reviewModel.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true },
    ).exec();

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return { success: true, data: review };
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
