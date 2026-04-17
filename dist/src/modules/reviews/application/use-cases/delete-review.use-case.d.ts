import { IReviewRepository } from '../../domain/repositories/review.repository.interface';
import { RecalculateProviderRatingUseCase } from '../../../providers/application/use-cases/recalculate-provider-rating.use-case';
export declare class DeleteReviewUseCase {
    private readonly reviewRepository;
    private readonly recalculateProviderRatingUseCase;
    constructor(reviewRepository: IReviewRepository, recalculateProviderRatingUseCase: RecalculateProviderRatingUseCase);
    execute(reviewId: string, currentUser: any): Promise<boolean>;
}
