import { Inject, Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../domain/entities/order.entity';
import { OrderStatus } from '../../../../common/enums/status.enum';
import { OrderEvents, OrderStatusChangedEvent } from '../../domain/events/order.events';

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
    private readonly eventEmitter: EventEmitter2,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async execute(id: string, status: OrderStatus, currentUser: any): Promise<OrderEntity> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Ownership Verification
    const isProvider = order.provider?.toString() === currentUser._id?.toString();
    const isAdmin = currentUser.role === 'admin';

    if (!isProvider && !isAdmin) {
      throw new ForbiddenException('You do not have permission to update status for this order');
    }

    // Business Logic: Prevent invalid transitions if necessary
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot update status of a cancelled order');
    }

    const oldStatus = order.status;
    const updateData: any = { status };

    // Update specific timestamps
    if (status === OrderStatus.COMPLETED) updateData.completedAt = new Date();
    if (status === OrderStatus.CANCELLED) updateData.cancelledAt = new Date();
    if (status === OrderStatus.IN_PROGRESS) updateData.startedAt = new Date();

    const updatedOrder = await this.orderRepository.update(id, updateData);

    // Invalidate Cache
    await this.cacheManager.del(`order_${id}`);

    // Emit event for automation (Notifications, logs, etc.)
    this.eventEmitter.emit(
      OrderEvents.STATUS_CHANGED,
      new OrderStatusChangedEvent(
        id,
        oldStatus,
        status,
        order.orderNumber,
        order.user as any,
        order.provider as any,
      ),
    );

    return updatedOrder;
  }
}
