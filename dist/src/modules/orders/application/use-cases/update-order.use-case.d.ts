import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../domain/entities/order.entity';
export declare class UpdateOrderUseCase {
    private readonly orderRepository;
    constructor(orderRepository: IOrderRepository);
    execute(id: string, dto: {
        scheduleTime?: string;
        notes?: string;
        location?: any;
    }): Promise<OrderEntity>;
}
