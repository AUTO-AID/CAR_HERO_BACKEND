import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IReviewRepository } from '../../domain/repositories/review.repository.interface';
import { ProvidersService } from '../../../providers/providers.service';

@Injectable()
export class DeleteReviewUseCase {
  constructor(
    @Inject(IReviewRepository)
    private readonly reviewRepository: IReviewRepository,
    private readonly providersService: ProvidersService,
  ) {}

  async execute(reviewId: string, currentUser: any): Promise<boolean> {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Only the user who wrote the review (or Admin) can delete it
    if (review.user.toString() !== currentUser._id.toString() && currentUser.role !== 'admin') {
      throw new ForbiddenException('You do not have permission to delete this review');
    }

    const providerId = review.provider;
    const deleted = await this.reviewRepository.delete(reviewId);

    if (deleted) {
      // Recalculate provider rating stats after deletion
      const stats = await this.reviewRepository.getAverageRating(providerId);
      await this.providersService.recalculateRating(providerId, stats.averageRating, stats.totalReviews);
    }

    return deleted;
  }
}
