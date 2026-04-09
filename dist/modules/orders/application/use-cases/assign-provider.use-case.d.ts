import { EventEmitter2 } from '@nestjs/event-emitter';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../domain/entities/order.entity';
export declare class AssignProviderUseCase {
    private readonly orderRepository;
    private readonly eventEmitter;
    constructor(orderRepository: IOrderRepository, eventEmitter: EventEmitter2);
    execute(id: string, providerId: string): Promise<OrderEntity>;
}
