import { IReviewRepository } from '../../domain/repositories/review.repository.interface';
import { ReviewEntity } from '../../domain/entities/review.entity';
import { IOrderRepository } from '../../../orders/domain/repositories/order.repository.interface';
import { IBookingRepository } from '../../../bookings/domain/repositories/booking.repository.interface';
import { UpdateProviderRatingUseCase } from '../../../providers/application/use-cases/update-provider-rating.use-case';
export interface CreateReviewDto {
    orderId?: string;
    bookingId?: string;
    rating: number;
    comment?: string;
    serviceQuality?: number;
    punctuality?: number;
    professionalism?: number;
    valueForMoney?: number;
    images?: string[];
}
export declare class CreateReviewUseCase {
    private readonly reviewRepository;
    private readonly orderRepository;
    private readonly bookingRepository;
    private readonly updateProviderRatingUseCase;
    constructor(reviewRepository: IReviewRepository, orderRepository: IOrderRepository, bookingRepository: IBookingRepository, updateProviderRatingUseCase: UpdateProviderRatingUseCase);
    execute(dto: CreateReviewDto, currentUser: any): Promise<ReviewEntity>;
}
