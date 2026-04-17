import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Cache } from 'cache-manager';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../domain/entities/order.entity';
import { OrderStatus } from '../../../../core/enums/status.enum';
import { TransferEarningsUseCase } from '../../../../modules/wallet/application/use-cases/transfer-earnings.use-case';
export declare class UpdateOrderStatusUseCase {
    private readonly orderRepository;
    private readonly eventEmitter;
    private readonly cacheManager;
    private readonly transferEarnings;
    constructor(orderRepository: IOrderRepository, eventEmitter: EventEmitter2, cacheManager: Cache, transferEarnings: TransferEarningsUseCase);
    execute(id: string, status: OrderStatus, currentUser: any): Promise<OrderEntity>;
}
