import type { Cache } from 'cache-manager';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../domain/entities/order.entity';
import { VerifyPaymentDto } from '../dto/verify-payment.dto';
export declare class VerifyPaymentUseCase {
    private readonly orderRepository;
    private readonly cacheManager;
    constructor(orderRepository: IOrderRepository, cacheManager: Cache);
    execute(id: string, dto: VerifyPaymentDto): Promise<OrderEntity>;
}
