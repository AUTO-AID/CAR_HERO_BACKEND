import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../domain/entities/order.entity';
export declare class ExportOrdersUseCase {
    private readonly orderRepository;
    constructor(orderRepository: IOrderRepository);
    execute(from: string, to: string, status?: string): Promise<OrderEntity[]>;
}
