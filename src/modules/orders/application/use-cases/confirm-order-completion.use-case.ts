import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Cache } from 'cache-manager';
import { OrderStatus } from '../../../../core/enums/status.enum';
import { TransferEarningsUseCase } from '../../../wallet/application/use-cases/transfer-earnings.use-case';
import { StatusHistoryService } from '../../../status-history/application/services/status-history.service';
import { OrderEvents, OrderStatusChangedEvent } from '../../domain/events/order.events';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderStateMachine } from '../../domain/services/order-state-machine';
import { AwardLoyaltyPointsUseCase } from '../../../wallet/application/use-cases/award-loyalty-points.use-case';
import {
  orderEarningsBase,
  orderLoyaltyBase,
  orderPromotionalCost,
} from '../../domain/services/order-earnings-base';
import { isPlatformHeldPayment } from '../../domain/services/order-payment-custody';

@Injectable()
export class ConfirmOrderCompletionUseCase {
  constructor(
    @Inject(IOrderRepository) private readonly orders: IOrderRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly transferEarnings: TransferEarningsUseCase,
    private readonly awardLoyaltyPoints: AwardLoyaltyPointsUseCase,
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
    /**
     * **لا شهادة على عملٍ لم يُعلَن انتهاؤه.**
     *
     * التأكيد يخصّ `AWAITING_CUSTOMER_CONFIRMATION` وحدها: الفنّي قال «أنهيتُ»
     * والعميل يشهد. وكان الشرط الوحيد هنا `assertTransition` بدور
     * `'user-confirmation'` — وهو ليس `'user'` ولا `'provider'`، فيسقط عنه كلا
     * القيدين، ويبقى `IN_PROGRESS → COMPLETED` مشروعاً في الخريطة العامّة.
     *
     * فكان العميل يُنهي الطلب **والفنّي ما يزال تحت السيارة**: تُحرَّر الأرباح
     * على عملٍ لم يكتمل، ولا يُكتب `completionRequestedAt` فتضيع مدّة الخدمة من
     * القياس، ثم يُردّ الفنّي حين يضغط «أنهيت» بـ«هذا الطلب منتهٍ» — ولم يكن
     * أنهاه أحد.
     *
     * والقيد على الحالة لا على اسم الدور: هذا المسار يخدم فاعلَين (العميل
     * والتأكيد التلقائي) والشرط واحد لكليهما، فوضعُه هنا يغني عن دورٍ ثالث
     * يُخترع ليتخطّى الحارسَين معاً.
     */
    if (order.status !== OrderStatus.AWAITING_CUSTOMER_CONFIRMATION) {
      throw new BadRequestException(
        OrderStateMachine.isTerminal(order.status)
          ? 'هذا الطلب منتهٍ بالفعل.'
          : 'لا يمكن تأكيد الإنجاز قبل أن ينهي الفني الخدمة.',
      );
    }

    // بلا دور: قيود `providerAllowedTargets`/`userAllowedTargets` تحرس **نقطة
    // النهاية العامّة** (`PATCH /orders/:id/status`) حيث الهدف يصل من جسم
    // الطلب. هنا الهدف ثابت في الشيفرة، والملكية والحالة محروستان أعلاه —
    // فيبقى من `assertTransition` ما نريده فعلاً: شرعية الانتقال نفسه.
    OrderStateMachine.assertTransition(order.status, OrderStatus.COMPLETED);

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

    // الأساس نفسه الذي يستعمله مسار تحديث الحالة — انظر `orderEarningsBase`
    const earningsBase = orderEarningsBase(updated);
    if (updated.providerId && earningsBase > 0) {
      await this.transferEarnings.execute(
        updated.providerId,
        earningsBase,
        updated.id,
        'order',
        orderPromotionalCost(updated),
        // الحيازة نفسها التي يقرؤها مسار تحديث الحالة — وإلّا اختلف اتجاه
        // القيد بحسب مَن ضغط زرّ الإتمام.
        { platformHoldsPayment: isPlatformHeldPayment(updated.paymentMethod) },
      );
    }

    // نقاط العميل — على ما دفعه لا على الإجمالي (انظر `orderLoyaltyBase`).
    // بلا هذا النداء يبقى رصيد النقاط صفراً إلى الأبد وشاشة الاستبدال معطّلة.
    if (updated.userId) {
      await this.awardLoyaltyPoints.execute(
        updated.userId,
        orderLoyaltyBase(updated),
        updated.id,
        updated.orderNumber,
      );
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
