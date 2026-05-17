import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../domain/entities/order.entity';
import { PaymentStatus } from '../../../../core/enums/status.enum';
import { VerifyPaymentDto } from '../dto/verify-payment.dto';
import type { IWalletRepository } from '../../../../modules/wallet/domain/repositories/wallet.repository.interface';
import { Transaction } from '../../../../modules/wallet/domain/entities/transaction.entity';
import { TransactionType } from '../../../../core/enums/status.enum';

@Injectable()
export class VerifyPaymentUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    @Inject('IWalletRepository')
    private readonly walletRepository: IWalletRepository,
  ) {}

  async execute(id: string, dto: VerifyPaymentDto): Promise<OrderEntity> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Business Rule: Check if payment is already confirmed
    if (order.paymentStatus === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Order is already paid');
    }

    // Future: Add real gateway verification logic here if needed

    const updatedOrder = await this.orderRepository.updatePaymentDetails(id, dto.paymentId, dto.paymentMethod);
    
    // 💰 Transaction Record: Document the customer payment in the system
    if (updatedOrder.total > 0 && updatedOrder.userId) {
      await this.walletRepository.executeTransaction('platform_earnings', 'system', async (platformWallet, session) => {
        const balanceBefore = platformWallet.balance;
        // The platform "receives" the money first
        platformWallet.deposit(updatedOrder.total);
        const balanceAfter = platformWallet.balance;

        const transaction = new Transaction(
          Transaction.generateTransactionNumber(),
          platformWallet.id!,
          platformWallet.ownerId,
          platformWallet.ownerType,
          TransactionType.CREDIT,
          updatedOrder.total,
          balanceBefore,
          balanceAfter,
          `Payment for order #${updatedOrder.orderNumber}`,
          undefined,
          'order',
          updatedOrder.id,
          dto.paymentMethod,
          dto.paymentId,
          'completed'
        );

        return { wallet: platformWallet, transaction };
      });
    }

    // Invalidate Cache
    await this.cacheManager.del(`order_${id}`);
    
    return updatedOrder;
  }
}
