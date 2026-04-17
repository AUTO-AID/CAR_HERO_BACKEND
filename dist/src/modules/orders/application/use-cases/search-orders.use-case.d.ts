import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../domain/entities/order.entity';
export declare class SearchOrdersUseCase {
    private readonly orderRepository;
    constructor(orderRepository: IOrderRepository);
    execute(query: string): Promise<OrderEntity[]>;
}
