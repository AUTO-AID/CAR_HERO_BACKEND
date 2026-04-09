import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IReviewRepository } from '../../domain/repositories/review.repository.interface';
import { ReviewEntity } from '../../domain/entities/review.entity';

@Injectable()
export class RespondToReviewUseCase {
  constructor(
    @Inject(IReviewRepository)
    private readonly reviewRepository: IReviewRepository,
  ) {}

  async execute(reviewId: string, response: string, currentUser: any): Promise<ReviewEntity> {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Only the provider assigned to the review (or Admin) can respond
    if (review.provider.toString() !== currentUser.providerId?.toString() && currentUser.role !== 'admin') {
      throw new ForbiddenException('You do not have permission to respond to this review');
    }

    return this.reviewRepository.update(reviewId, {
      providerResponse: response,
      providerRespondedAt: new Date(),
    });
  }
}
