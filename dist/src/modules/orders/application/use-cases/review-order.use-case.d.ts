import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { CreateReviewUseCase } from '../../../reviews/application/use-cases/create-review.use-case';
import { ReviewOrderDto } from '../dto/review-order.dto';
export declare class ReviewOrderUseCase {
    private readonly orderRepository;
    private readonly createReviewUseCase;
    constructor(orderRepository: IOrderRepository, createReviewUseCase: CreateReviewUseCase);
    execute(id: string, dto: ReviewOrderDto, currentUser: any): Promise<import("../../../reviews/domain/entities/review.entity").ReviewEntity>;
}
