import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
export declare class NotifyOrderUseCase {
    private readonly orderRepository;
    constructor(orderRepository: IOrderRepository);
    execute(id: string, message: string, type: string): Promise<void>;
}
