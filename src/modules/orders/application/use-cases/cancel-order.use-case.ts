import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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

@Injectable()
export class CancelOrderUseCase {
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

  async execute(id: string, dto: CancelOrderDto, currentUser?: any): Promise<OrderEntity> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Ownership Verification
    const isOwner = order.userId?.toString() === currentUser._id?.toString();
    const isProvider = order.providerId?.toString() === currentUser._id?.toString();
    const isAdmin = currentUser.role === 'admin';

    if (!isOwner && !isProvider && !isAdmin) {
      throw new ForbiddenException('You do not have permission to cancel this order');
    }

    OrderStateMachine.assertCancellable(order.status);

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

    // 💰 Refund Logic: If order was paid, return money to user wallet
    if (order.paymentStatus === PaymentStatus.COMPLETED && order.total > 0 && order.userId) {
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

        return { wallet, transaction };
      });

      // Update payment status to REFUNDED
      await this.orderRepository.update(id, { paymentStatus: PaymentStatus.REFUNDED });
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
      ),
    );

    this.eventEmitter.emit(OrderEvents.CANCELLED, { orderId: id, reason: dto.reason });

    return cancelledOrder;
  }
}
