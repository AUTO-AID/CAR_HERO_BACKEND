import { IReviewRepository } from '../../domain/repositories/review.repository.interface';
import { ReviewEntity } from '../../domain/entities/review.entity';
export declare class RespondToReviewUseCase {
    private readonly reviewRepository;
    constructor(reviewRepository: IReviewRepository);
    execute(reviewId: string, response: string, currentUser: any): Promise<ReviewEntity>;
}
