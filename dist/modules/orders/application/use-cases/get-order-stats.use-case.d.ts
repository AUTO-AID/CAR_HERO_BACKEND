import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
export declare class GetOrderStatsUseCase {
    private readonly orderRepository;
    constructor(orderRepository: IOrderRepository);
    execute(period: string): Promise<any>;
}
