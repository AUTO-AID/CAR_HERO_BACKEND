import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
export declare class DeleteOrderUseCase {
    private readonly orderRepository;
    constructor(orderRepository: IOrderRepository);
    execute(id: string): Promise<void>;
}
