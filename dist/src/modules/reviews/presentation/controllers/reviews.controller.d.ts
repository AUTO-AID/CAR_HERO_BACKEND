import { CreateReviewUseCase } from '../../application/use-cases/create-review.use-case';
import { GetProviderReviewsUseCase } from '../../application/use-cases/get-provider-reviews.use-case';
import { RespondToReviewUseCase } from '../../application/use-cases/respond-to-review.use-case';
import { DeleteReviewUseCase } from '../../application/use-cases/delete-review.use-case';
import { CreateReviewDto, ProviderResponseDto, ReviewQueryDto } from '../dtos/review.dto';
export declare class ReviewsController {
    private readonly createReviewUseCase;
    private readonly getProviderReviewsUseCase;
    private readonly respondToReviewUseCase;
    private readonly deleteReviewUseCase;
    constructor(createReviewUseCase: CreateReviewUseCase, getProviderReviewsUseCase: GetProviderReviewsUseCase, respondToReviewUseCase: RespondToReviewUseCase, deleteReviewUseCase: DeleteReviewUseCase);
    createReview(dto: CreateReviewDto, req: any): Promise<import("../../domain/entities/review.entity").ReviewEntity>;
    getProviderReviews(providerId: string, query: ReviewQueryDto): Promise<{
        reviews: import("../../domain/entities/review.entity").ReviewEntity[];
        total: number;
    }>;
    respondToReview(id: string, dto: ProviderResponseDto, req: any): Promise<import("../../domain/entities/review.entity").ReviewEntity>;
    deleteReview(id: string, req: any): Promise<boolean>;
}
