import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../domain/entities/order.entity';
import { OrderStatus } from '../../../../core/enums/status.enum';
import { OrderEvents, OrderStatusChangedEvent } from '../../domain/events/order.events';
import { TransferEarningsUseCase } from '../../../../modules/wallet/application/use-cases/transfer-earnings.use-case';
import { StatusHistoryService } from '../../../status-history/application/services/status-history.service';
import { OrderStateMachine } from '../../domain/services/order-state-machine';

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
    private readonly eventEmitter: EventEmitter2,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly transferEarnings: TransferEarningsUseCase,
    private readonly statusHistoryService: StatusHistoryService,
  ) {}

  async execute(id: string, status: OrderStatus, currentUser: any): Promise<OrderEntity> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Ownership Verification
    const isProvider = order.providerId?.toString() === currentUser._id?.toString();
    const isAdmin = currentUser.role === 'admin';

    if (!isProvider && !isAdmin) {
      throw new ForbiddenException('You do not have permission to update status for this order');
    }

    OrderStateMachine.assertTransition(order.status, status, currentUser?.role);

    const oldStatus = order.status;
    const updateData: any = { status };

    // Update specific timestamps
    if (status === OrderStatus.ACCEPTED || status === OrderStatus.PROVIDER_ASSIGNED) updateData.acceptedAt = new Date();
    if (status === OrderStatus.COMPLETED) updateData.completedAt = new Date();
    if (status === OrderStatus.CANCELLED || status === OrderStatus.REJECTED) updateData.cancelledAt = new Date();
    if (status === OrderStatus.IN_PROGRESS) updateData.startedAt = new Date();

    const updatedOrder = await this.orderRepository.update(id, updateData);

    await this.statusHistoryService.record({
      entityType: 'order',
      entityId: id,
      orderNumber: order.orderNumber,
      fromStatus: oldStatus,
      toStatus: status,
      changedBy: currentUser?._id || currentUser?.userId || currentUser?.id,
      changedByRole: currentUser?.role,
      changedByType: currentUser?.accountType || currentUser?.role,
      metadata: {
        isScheduled: !!order.isScheduled,
      },
    });

    // 💰 Special Logic: Transfer earnings to provider on completion
    if (status === OrderStatus.COMPLETED && updatedOrder.providerId && updatedOrder.total > 0) {
      await this.transferEarnings.execute(
        updatedOrder.providerId,
        updatedOrder.total,
        updatedOrder.id,
        'order'
      );
    }

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
        order.userId as any,
        order.providerId as any,
      ),
    );

    return updatedOrder;
  }
}
