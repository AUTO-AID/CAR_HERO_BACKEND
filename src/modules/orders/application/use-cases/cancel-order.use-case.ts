import { Inject, Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../domain/entities/order.entity';
import { OrderStatus } from '../../../../common/enums/status.enum';
import { OrderEvents, OrderStatusChangedEvent } from '../../domain/events/order.events';
import { CancelOrderDto } from '../dto/cancel-order.dto';

@Injectable()
export class CancelOrderUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
    private readonly eventEmitter: EventEmitter2,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async execute(id: string, dto: CancelOrderDto, currentUser: any): Promise<OrderEntity> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Ownership Verification
    const isOwner = order.user?.toString() === currentUser._id?.toString();
    const isProvider = order.provider?.toString() === currentUser._id?.toString();
    const isAdmin = currentUser.role === 'admin';

    if (!isOwner && !isProvider && !isAdmin) {
      throw new ForbiddenException('You do not have permission to cancel this order');
    }

    // Business Logic: Check if cancellation is allowed
    const nonCancellableStatuses = [OrderStatus.COMPLETED, OrderStatus.CANCELLED];
    if (nonCancellableStatuses.includes(order.status)) {
      throw new BadRequestException(`Cannot cancel an order that is already ${order.status}`);
    }

    if (order.status === OrderStatus.IN_PROGRESS) {
      throw new BadRequestException('Cannot cancel an order that is already in progress');
    }

    const oldStatus = order.status;
    const cancelledOrder = await this.orderRepository.cancelOrder(id, dto.reason, dto.cancelledBy);

    // Invalidate Cache
    await this.cacheManager.del(`order_${id}`);

    // Emit events
    this.eventEmitter.emit(
      OrderEvents.STATUS_CHANGED,
      new OrderStatusChangedEvent(
        id,
        oldStatus,
        OrderStatus.CANCELLED,
        order.orderNumber,
        order.user as any,
        order.provider as any,
      ),
    );

    this.eventEmitter.emit(OrderEvents.CANCELLED, { orderId: id, reason: dto.reason });

    return cancelledOrder;
  }
}
