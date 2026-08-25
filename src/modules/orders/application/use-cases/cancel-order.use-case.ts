import { Inject, Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../domain/entities/order.entity';
import { OrderStatus } from '../../../../core/enums/status.enum';
import { OrderEvents, OrderStatusChangedEvent } from '../../domain/events/order.events';
import { CancelOrderDto } from '../dto/cancel-order.dto';
import type { IWalletRepository } from '../../../../modules/wallet/domain/repositories/wallet.repository.interface';
import { Transaction } from '../../../../modules/wallet/domain/entities/transaction.entity';
import { PaymentStatus, TransactionType } from '../../../../core/enums/status.enum';
import { StatusHistoryService } from '../../../status-history/application/services/status-history.service';
import { OrderStateMachine } from '../../domain/services/order-state-machine';
import { isPlatformHeldPayment } from '../../domain/services/order-payment-custody';

@Injectable()
export class CancelOrderUseCase {
  private readonly logger = new Logger(CancelOrderUseCase.name);

  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
    private readonly eventEmitter: EventEmitter2,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    @Inject('IWalletRepository')
    private readonly walletRepository: IWalletRepository,
    private readonly statusHistoryService: StatusHistoryService,
  ) {}

  /**
   * `options` منفصل عن `dto` عمداً: الأخير جسمُ طلبٍ يصل من الشبكة، وراية
   * كتم الإشعار قرارٌ داخلي لا يجوز أن يملكه من ينادي الـ API.
   */
  async execute(
    id: string,
    dto: CancelOrderDto,
    currentUser?: any,
    options: { suppressStatusNotice?: boolean } = {},
  ): Promise<OrderEntity> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Ownership Verification
    const currentUserId = currentUser?._id?.toString();
    const currentProviderId = currentUser?.providerId?.toString();
    const isOwner = !!order.userId && !!currentUserId && order.userId.toString() === currentUserId;
    const isProvider =
      !!order.providerId &&
      ((!!currentProviderId && order.providerId.toString() === currentProviderId) ||
      (!!currentUserId && order.providerId.toString() === currentUserId));
    const isAdmin = currentUser?.role === 'admin';
    const isSystem = currentUser?.role === 'system';

    if (!isOwner && !isProvider && !isAdmin && !isSystem) {
      throw new ForbiddenException('You do not have permission to cancel this order');
    }

    // الدور يُشتقّ من الملكية لا من نصّ الـ JWT: توكن العميل قد يصل بلا
    // `role`، وقراءته حرفياً كانت تُسقط القيد عن صاحب الطلب نفسه.
    const actorRole = isAdmin || isSystem || isProvider ? currentUser?.role : 'user';
    OrderStateMachine.assertCancellable(order.status, actorRole);

    const oldStatus = order.status;
    const cancelledOrder = await this.orderRepository.cancelOrder(id, dto.reason, dto.cancelledBy);

    await this.statusHistoryService.record({
      entityType: 'order',
      entityId: id,
      orderNumber: order.orderNumber,
      fromStatus: oldStatus,
      toStatus: OrderStatus.CANCELLED,
      changedBy: currentUser?._id || currentUser?.userId || currentUser?.id,
      changedByRole: currentUser?.role,
      changedByType: currentUser?.accountType || currentUser?.role || dto.cancelledBy,
      reason: dto.reason,
      metadata: {
        isScheduled: !!order.isScheduled,
        cancelledBy: dto.cancelledBy,
      },
    });

    /**
     * 💰 الاسترجاع — **لما قبضته المنصّة وحده**.
     *
     * `paymentStatus = completed` تقول «سُدِّد» لا «سُدِّد إلينا». الشرط كان
     * يكتفي بها فيودع `order.total` رصيداً حقيقياً في محفظة العميل مهما كانت
     * الطريقة — والنقدُ يُسلَّم للفنّي لا للمنصّة، فكان الإيداع **يطبع** مالاً
     * لم يصل. انظر `isPlatformHeldPayment`.
     */
    const wasPaid = order.paymentStatus === PaymentStatus.COMPLETED;
    const platformHoldsTheMoney = isPlatformHeldPayment(order.paymentMethod);

    /**
     * 🎟️ حجز ردّ النقاط **قبل** الفرعين — كلاهما يردّ، فالحرس واحد لهما.
     *
     * الاسترجاع النقدي يحرس نفسه بالصدفة: شرطه `paymentStatus = completed`،
     * والنداء الأول يكتب `REFUNDED` فيُغلق الباب على من بعده. وفرعُ النقاط بلا
     * نظير لذلك — شرطه وجود `metadata.pointsRedeemed`، وهو حقلٌ يبقى كما هو بعد
     * الإلغاء. فكان كل نداء إلغاء يقرؤه فيودع النقاط من جديد بلا سقف.
     *
     * والعلامة تُحجز ذرّياً لا تُفحَص، على نمط `AwardLoyaltyPointsUseCase`:
     * نداءان متزامنان يقرآن كلاهما «لم تُردّ» فيردّان معاً.
     */
    const pointsToRefund = order.userId ? await this.orderRepository.claimPointsRefund(id) : 0;

    if (wasPaid && !platformHoldsTheMoney && order.total > 0) {
      // ليس عطلاً بل تسويةٌ خارج المنصّة: المال بين الفنّي والعميل، ومَن يردّه
      // هما. نعلّم الطلب كي يظهر لمن يراجع بدل أن يمضي بلا أثر — ولا نكتب
      // `refunded` على استرجاع لم يقع.
      await this.orderRepository.update(id, {
        'metadata.cancellation.offPlatformSettlement': {
          paymentMethod: order.paymentMethod ?? null,
          amount: order.total,
          flaggedAt: new Date(),
        },
      } as any);
      this.logger.warn(
        `Order ${order.orderNumber} cancelled after an off-platform payment ` +
          `(${order.paymentMethod}, ${order.total}) — settlement is manual, no wallet credit issued.`,
      );
    }

    if (wasPaid && platformHoldsTheMoney && order.total > 0 && order.userId) {
      try {
        await this.walletRepository.executeTransaction(order.userId, 'user', async (wallet, session) => {
          const balanceBefore = wallet.balance;
          wallet.deposit(order.total);
          const balanceAfter = wallet.balance;

          const transaction = new Transaction(
            Transaction.generateTransactionNumber(),
            wallet.id!,
            wallet.ownerId,
            wallet.ownerType,
            TransactionType.REFUND,
            order.total,
            balanceBefore,
            balanceAfter,
            `Refund for cancelled order #${order.orderNumber}`,
            undefined,
            'order',
            order.id,
            undefined,
            undefined,
            'completed'
          );

          // النقاط من الحجز الذرّي أعلاه لا من `metadata` مباشرةً — وإلّا رُدَّت
          // مع كل نداء إلغاء.
          if (pointsToRefund > 0) {
            wallet.loyaltyPoints = (wallet.loyaltyPoints || 0) + pointsToRefund;
          }

          return { wallet, transaction };
        });
      } catch (error) {
        // الحجز يُفكّ كي تُردّ النقاط في محاولة لاحقة بدل أن تضيع مُعلَّمةً
        // بردٍّ لم يقع. والاسترجاع النقدي يحرسه `paymentStatus` الذي لم يُكتب.
        await this.orderRepository.releasePointsRefundClaim(id).catch(() => undefined);
        throw error;
      }

      // Update payment status to REFUNDED
      await this.orderRepository.update(id, { paymentStatus: PaymentStatus.REFUNDED });
    } else if (pointsToRefund > 0 && order.userId) {
      // النقاط تُردّ ولو لم يقع استرجاع نقدي: إمّا لأن الطلب لم يُدفع بعد، وإمّا
      // لأن دفعه كان خارج المنصّة (نقداً) فلا شيء لدينا نردّه — والنقاط في
      // الحالتين خُصمت من محفظتنا لحظة الحجز، فردّها واجبٌ في الحالتين.
      try {
        await this.walletRepository.executeTransaction(order.userId, 'user', async (wallet, session) => {
          wallet.loyaltyPoints = (wallet.loyaltyPoints || 0) + pointsToRefund;

          // قيدٌ بلا حركة رصيد — النقاط ليست مالاً في المحفظة
          const transaction = new Transaction(
            Transaction.generateTransactionNumber(),
            wallet.id!,
            wallet.ownerId,
            wallet.ownerType,
            TransactionType.LOYALTY_POINTS,
            0,
            wallet.balance,
            wallet.balance,
            `Loyalty points refunded for cancelled order #${order.orderNumber}`,
            undefined,
            'order',
            order.id,
            undefined,
            undefined,
            'completed',
            { pointsRefunded: pointsToRefund }
          );

          return { wallet, transaction };
        });
      } catch (error) {
        await this.orderRepository.releasePointsRefundClaim(id).catch(() => undefined);
        throw error;
      }
    }

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
        order.userId as any,
        order.providerId as any,
        options.suppressStatusNotice,
      ),
    );

    this.eventEmitter.emit(OrderEvents.CANCELLED, { orderId: id, reason: dto.reason });

    return cancelledOrder;
  }
}
