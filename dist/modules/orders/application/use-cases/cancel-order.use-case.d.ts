import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Cache } from 'cache-manager';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../domain/entities/order.entity';
import { CancelOrderDto } from '../dto/cancel-order.dto';
export declare class CancelOrderUseCase {
    private readonly orderRepository;
    private readonly eventEmitter;
    private readonly cacheManager;
    constructor(orderRepository: IOrderRepository, eventEmitter: EventEmitter2, cacheManager: Cache);
    execute(id: string, dto: CancelOrderDto, currentUser?: any): Promise<OrderEntity>;
}
