import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { CancelOrderUseCase } from '../../application/use-cases/cancel-order.use-case';
export declare class OrdersCronService {
    private readonly orderRepository;
    private readonly cancelOrderUseCase;
    private readonly logger;
    constructor(orderRepository: IOrderRepository, cancelOrderUseCase: CancelOrderUseCase);
    handleExpiredOrders(): Promise<void>;
}
