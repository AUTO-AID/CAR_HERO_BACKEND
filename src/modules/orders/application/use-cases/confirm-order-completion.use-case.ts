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
    return this.finalize(id, order, {
      actorId: currentUser?._id,
      actorRole: 'user',
      reason: 'Customer confirmed service completion',
    });
  }

  /**
   * التأكيد التلقائي بعد انقضاء مهلة العميل.
   *
   * حجز أرباح الفنّي رهينة فعلٍ لا مصلحة للعميل في أدائه ظلمٌ ومصدر شكاوى:
   * الخدمة وقعت، والصمت ليس اعتراضاً. يمرّ من `finalize` نفسها كي يقع تحويل
   * الأرباح وسجلّ الحالات والبثّ اللحظي مرّة واحدة في مكان واحد — ولا يُبنى
   * مسار مالٍ موازٍ ينسى نصفها.
   */
  async executeAsSystem(id: string) {
    const order = await this.orders.findById(id);
    if (!order) throw new NotFoundException('Order not found');
    return this.finalize(id, order, {
      actorRole: 'system',
      reason: 'Auto-confirmed after customer confirmation window elapsed',
      autoConfirmed: true,
    });
  }

  private async finalize(
    id: string,
    order: any,
    options: { actorId?: any; actorRole: 'user' | 'system'; reason: string; autoConfirmed?: boolean },
  ) {
    OrderStateMachine.assertTransition(order.status, OrderStatus.COMPLETED, 'user-confirmation');

    const now = new Date();
    const updated = await this.orders.update(id, {
      status: OrderStatus.COMPLETED,
      completedAt: now,
      // `customerConfirmedAt` يبقى فارغاً عند التأكيد التلقائي عمداً: تمييز
      // «أكّد العميل» عن «افتُرض التأكيد» ما تحتاجه المحاسبة عند أي اعتراض.
      ...(options.autoConfirmed
        ? { 'metadata.autoConfirmedAt': now }
        : { customerConfirmedAt: now }),
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
      changedBy: options.actorId,
      changedByRole: options.actorRole,
      changedByType: options.actorRole,
      reason: options.reason,
    });

    await this.cache.del(`order_${id}`);
    this.events.emit(
      OrderEvents.STATUS_CHANGED,
      new OrderStatusChangedEvent(id, order.status, OrderStatus.COMPLETED, order.orderNumber, order.userId, order.providerId),
    );
    return updated;
  }
}
