import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IReviewRepository } from '../../domain/repositories/review.repository.interface';
import { RecalculateProviderRatingUseCase } from '../../../providers/application/use-cases/recalculate-provider-rating.use-case';

@Injectable()
export class DeleteReviewUseCase {
  constructor(
    @Inject(IReviewRepository)
    private readonly reviewRepository: IReviewRepository,
    private readonly recalculateProviderRatingUseCase: RecalculateProviderRatingUseCase,
  ) {}

  async execute(reviewId: string, currentUser: any): Promise<boolean> {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Only the user who wrote the review (or Admin) can delete it
    const currentUserId = currentUser?._id?.toString() || currentUser?.userId?.toString() || currentUser?.id?.toString();
    if (review.user.toString() !== currentUserId && currentUser.role !== 'admin') {
      throw new ForbiddenException('You do not have permission to delete this review');
    }

    const providerId = review.provider;
    const deleted = await this.reviewRepository.delete(reviewId);

    if (deleted && providerId) {
      // Recalculate provider rating stats after deletion
      const stats = await this.reviewRepository.getAverageRating(providerId);
      await this.recalculateProviderRatingUseCase.execute(providerId, stats.averageRating, stats.totalReviews);
    }

    return deleted;
  }
}
