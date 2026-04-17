import type { Cache } from 'cache-manager';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../domain/entities/order.entity';
export declare class GetOrderByIdUseCase {
    private readonly orderRepository;
    private readonly cacheManager;
    constructor(orderRepository: IOrderRepository, cacheManager: Cache);
    execute(id: string, currentUser: any): Promise<OrderEntity>;
}
