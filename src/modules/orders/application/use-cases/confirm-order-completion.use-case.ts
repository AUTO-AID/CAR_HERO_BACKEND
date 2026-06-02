import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Cache } from 'cache-manager';
import { OrderStatus } from '../../../../core/enums/status.enum';
import { TransferEarningsUseCase } from '../../../wallet/application/use-cases/transfer-earnings.use-case';
import { StatusHistoryService } from '../../../status-history/application/services/status-history.service';
import { OrderEvents, OrderStatusChangedEvent } from '../../domain/events/order.events';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderStateMachine } from '../../domain/services/order-state-machine';

@Injectable()
export class ConfirmOrderCompletionUseCase {
  constructor(
    @Inject(IOrderRepository) private readonly orders: IOrderRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly transferEarnings: TransferEarningsUseCase,
    private readonly histories: StatusHistoryService,
    private readonly events: EventEmitter2,
  ) {}

  async execute(id: string, currentUser: any) {
    const order = await this.orders.findById(id);
    if (!order) throw new NotFoundException('Order not found');
    if (!order.userId || !currentUser?._id || order.userId.toString() !== currentUser._id.toString()) {
      throw new ForbiddenException('Only the customer who created this order can confirm completion');
    }
    OrderStateMachine.assertTransition(order.status, OrderStatus.COMPLETED, 'user-confirmation');
    const updated = await this.orders.update(id, {
      status: OrderStatus.COMPLETED,
      completedAt: new Date(),
      customerConfirmedAt: new Date(),
    } as any);
    if (updated.providerId && updated.total > 0) {
      await this.transferEarnings.execute(updated.providerId, updated.total, updated.id, 'order');
    }
    await this.histories.record({
      entityType: 'order',
      entityId: id,
      orderNumber: order.orderNumber,
      fromStatus: order.status,
      toStatus: OrderStatus.COMPLETED,
      changedBy: currentUser?._id,
      changedByRole: 'user',
      changedByType: 'user',
      reason: 'Customer confirmed service completion',
    });
    await this.cache.del(`order_${id}`);
    this.events.emit(
      OrderEvents.STATUS_CHANGED,
      new OrderStatusChangedEvent(id, order.status, OrderStatus.COMPLETED, order.orderNumber, order.userId, order.providerId),
    );
    return updated;
  }
}
