import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { CreateReviewUseCase } from '../../../reviews/application/use-cases/create-review.use-case';
import { ReviewOrderDto } from '../dto/review-order.dto';

@Injectable()
export class ReviewOrderUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
    private readonly createReviewUseCase: CreateReviewUseCase,
  ) {}

  async execute(id: string, dto: ReviewOrderDto, currentUser: any) {
    // We delegate the logic to the centralized CreateReviewUseCase
    // This ensures consistency across all types of reviews
    return this.createReviewUseCase.execute({
      orderId: id,
      rating: dto.rating,
      comment: dto.comment,
    }, currentUser);
  }
}
