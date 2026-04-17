import { IReviewRepository } from '../../domain/repositories/review.repository.interface';
import { ReviewEntity } from '../../domain/entities/review.entity';
export declare class GetProviderReviewsUseCase {
    private readonly reviewRepository;
    constructor(reviewRepository: IReviewRepository);
    execute(providerId: string, page?: number, limit?: number): Promise<{
        reviews: ReviewEntity[];
        total: number;
    }>;
}
