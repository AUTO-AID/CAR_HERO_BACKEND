import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PaymentIntentRepository } from '../../infrastructure/repositories/payment-intent.repository';
import { ChamCashService } from './cham-cash.service';
import { PaymentIntent } from '../../domain/entities/payment-intent.entity';
import type { IWalletRepository } from '../../../wallet/domain/repositories/wallet.repository.interface';
import { Transaction } from '../../../wallet/domain/entities/transaction.entity';
import { TransactionType } from '../../../../core/enums/status.enum';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly paymentIntentRepository: PaymentIntentRepository,
    private readonly chamCashService: ChamCashService,
    @Inject('IWalletRepository')
    private readonly walletRepository: IWalletRepository,
  ) {}

  async initializePayment(userId: string, amount: number, purpose: 'wallet_topup' | 'order_payment', targetId?: string) {
    const referenceId = PaymentIntent.generateReferenceId();
    const gatewayUrl = this.chamCashService.generateCheckoutUrl(referenceId, amount);

    const intent = await this.paymentIntentRepository.create({
      userId,
      amount,
      purpose,
      status: 'pending',
      referenceId,
      gatewayUrl,
      targetId,
    });

    return {
      paymentIntentId: intent.id,
      referenceId: intent.referenceId,
      gatewayUrl: intent.gatewayUrl,
    };
  }

  async handleWebhook(payload: any, signature: string) {
    // 1. Verify Signature
    if (!this.chamCashService.verifySignature(payload, signature)) {
      this.logger.error('Invalid webhook signature');
      throw new BadRequestException('Invalid signature');
    }

    const { referenceId, status, transactionId } = payload;

    // 2. Find Payment Intent
    const intent = await this.paymentIntentRepository.findByReferenceId(referenceId);
    if (!intent) {
      throw new NotFoundException('Payment intent not found');
    }

    if (intent.status !== 'pending') {
      return { message: 'Already processed' };
    }

    // 3. Update Status
    if (status === 'success') {
      await this.paymentIntentRepository.updateStatus(referenceId, 'success');
      
      // 4. Fulfill the payment based on purpose
      if (intent.purpose === 'wallet_topup') {
        await this.fulfillWalletTopup(intent, transactionId);
      } else if (intent.purpose === 'order_payment') {
        // Here we could fulfill the order, but for simplicity, we can let orders be paid from wallet
        // Or implement the order logic here later
      }

    } else {
      await this.paymentIntentRepository.updateStatus(referenceId, 'failed');
    }

    return { received: true };
  }

  private async fulfillWalletTopup(intent: PaymentIntent, gatewayTransactionId: string) {
    try {
      await this.walletRepository.executeTransaction(intent.userId, 'user', async (wallet, session) => {
        const balanceBefore = wallet.balance;
        wallet.deposit(intent.amount);
        const balanceAfter = wallet.balance;

        const transaction = new Transaction(
          Transaction.generateTransactionNumber(),
          wallet.id!,
          intent.userId,
          'user',
          TransactionType.CREDIT,
          intent.amount,
          balanceBefore,
          balanceAfter,
          `Wallet top-up via Cham Cash`,
          undefined,
          'topup',
          intent.id,
          'cham_cash',
          gatewayTransactionId,
          'completed'
        );

        return { wallet, transaction };
      });
      this.logger.log(`Successfully topped up wallet for user ${intent.userId} amount ${intent.amount}`);
    } catch (error) {
      this.logger.error(`Failed to fulfill wallet topup for intent ${intent.id}:`, error);
    }
  }
}
