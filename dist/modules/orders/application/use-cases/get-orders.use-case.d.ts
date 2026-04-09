import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../domain/entities/order.entity';
export declare class GetOrdersUseCase {
    private readonly orderRepository;
    constructor(orderRepository: IOrderRepository);
    execute(criteria: any, page?: number, limit?: number): Promise<{
        orders: OrderEntity[];
        pagination: any;
    }>;
}
