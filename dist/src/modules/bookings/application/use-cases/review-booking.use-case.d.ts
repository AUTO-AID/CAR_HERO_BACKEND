import { IBookingRepository } from '../../domain/repositories/booking.repository.interface';
import { CreateReviewUseCase } from '../../../reviews/application/use-cases/create-review.use-case';
export declare class ReviewBookingUseCase {
    private readonly bookingRepository;
    private readonly createReviewUseCase;
    constructor(bookingRepository: IBookingRepository, createReviewUseCase: CreateReviewUseCase);
    execute(userId: string, bookingId: string, rating: number, comment: string, currentUser: any): Promise<import("../../../reviews/domain/entities/review.entity").ReviewEntity>;
}
