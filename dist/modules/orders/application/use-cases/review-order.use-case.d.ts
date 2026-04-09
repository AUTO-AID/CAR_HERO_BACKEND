import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../domain/entities/order.entity';
import { ReviewOrderDto } from '../dto/review-order.dto';
export declare class ReviewOrderUseCase {
    private readonly orderRepository;
    constructor(orderRepository: IOrderRepository);
    execute(id: string, dto: ReviewOrderDto, currentUser: any): Promise<OrderEntity>;
}
