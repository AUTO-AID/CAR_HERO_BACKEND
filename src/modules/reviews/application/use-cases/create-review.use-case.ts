import { Inject, Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { IReviewRepository } from '../../domain/repositories/review.repository.interface';
import { ReviewEntity } from '../../domain/entities/review.entity';
import { IOrderRepository } from '../../../orders/domain/repositories/order.repository.interface';
import { RecalculateProviderRatingUseCase } from '../../../providers/application/use-cases/recalculate-provider-rating.use-case';
import { OrderStatus } from '../../../../core/enums/status.enum';

import { EventEmitter2 } from '@nestjs/event-emitter';

export interface CreateReviewDto {
  orderId: string;
  rating: number;
  comment?: string;
  serviceQuality?: number;
  punctuality?: number;
  professionalism?: number;
  valueForMoney?: number;
  images?: string[];
}

@Injectable()
export class CreateReviewUseCase {
  constructor(
    @Inject(IReviewRepository)
    private readonly reviewRepository: IReviewRepository,
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
    private readonly recalculateProviderRatingUseCase: RecalculateProviderRatingUseCase,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: CreateReviewDto, currentUser: any): Promise<ReviewEntity> {
    if (!dto.orderId) {
      throw new BadRequestException('orderId is required');
    }

    let providerId: string;
    let userId: string;

    const order = await this.orderRepository.findById(dto.orderId);
    if (!order) throw new NotFoundException('Order not found');

    if (order.userId.toString() !== currentUser._id.toString() && currentUser.role !== 'admin') {
      throw new ForbiddenException('You do not have permission to review this order');
    }

    if (order.status !== OrderStatus.COMPLETED) {
      throw new BadRequestException('Order must be completed before reviewing');
    }

    const existing = await this.reviewRepository.findByOrder(dto.orderId);
    if (existing) throw new BadRequestException('Review already exists for this order');

    providerId = order.providerId!;
    userId = order.userId;

    if (!providerId) throw new BadRequestException('No provider associated with this transaction');

    // 3. Create Review Entity
    const review = ReviewEntity.create({
      user: userId,
      provider: providerId,
      rating: dto.rating,
      order: dto.orderId,
      comment: dto.comment,
      serviceQuality: dto.serviceQuality,
      punctuality: dto.punctuality,
      professionalism: dto.professionalism,
      valueForMoney: dto.valueForMoney,
      images: dto.images,
    });

    const savedReview = await this.reviewRepository.create(review);

    await this.orderRepository.update(dto.orderId, { rating: dto.rating } as any);

    // 5. Update Provider Rating Stats safely using aggregation to prevent race conditions
    const stats = await this.reviewRepository.getAverageRating(providerId);
    await this.recalculateProviderRatingUseCase.execute(providerId, stats.averageRating, stats.totalReviews);

    // 6. Notify AI Module to recalculate provider metrics
    this.eventEmitter.emit('review.created', { providerId });

    return savedReview;
  }
}
