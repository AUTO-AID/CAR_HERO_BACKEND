import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaymentIntentRepository } from '../../infrastructure/repositories/payment-intent.repository';
import { ChamCashService } from './cham-cash.service';
import { PaymentIntent } from '../../domain/entities/payment-intent.entity';
import type { IWalletRepository } from '../../../wallet/domain/repositories/wallet.repository.interface';
import { Transaction } from '../../../wallet/domain/entities/transaction.entity';
import { PaymentMethod, PaymentStatus, TransactionType } from '../../../../core/enums/status.enum';
import { Order, OrderDocument } from '../../../orders/infrastructure/persistence/mongoose/schemas/order.schema';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly paymentIntentRepository: PaymentIntentRepository,
    private readonly chamCashService: ChamCashService,
    @Inject('IWalletRepository')
    private readonly walletRepository: IWalletRepository,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
  ) {}

  async initializePayment(userId: string, amount: number, purpose: 'wallet_topup' | 'order_payment', targetId?: string) {
    // شحن المحفظة يقبل مبلغ العميل — هو يقرّر كم يشحن. أمّا دفع طلب فمبلغه
    // مقرَّر سلفاً، والوثوق بما يرسله العميل هنا يعني سدادَ طلبٍ بألف بمئة.
    const payableAmount =
      purpose === 'order_payment' ? await this.resolveOrderPayable(userId, targetId) : amount;

    const referenceId = PaymentIntent.generateReferenceId();
    const gatewayUrl = this.chamCashService.generateCheckoutUrl(referenceId, payableAmount);

    const intent = await this.paymentIntentRepository.create({
      userId,
      amount: payableAmount,
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

  /** المستحقّ الفعلي على طلبٍ يملكه هذا المستخدم ولم يُدفع بعد */
  private async resolveOrderPayable(userId: string, targetId?: string): Promise<number> {
    if (!targetId || !Types.ObjectId.isValid(targetId)) {
      throw new BadRequestException('A valid targetId (order id) is required for order payments');
    }

    const order = await this.orderModel
      .findOne({ _id: targetId, user: new Types.ObjectId(userId) })
      .select('payableAmount totalAmount paymentStatus')
      .lean()
      .exec();

    // الرسالة نفسها لطلبٍ غير موجود ولطلب غيره: تمييزهما يكشف وجود الطلبات.
    if (!order) throw new NotFoundException('Order not found');
    if (order.paymentStatus === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Order is already paid');
    }

    // `payableAmount` هو ما بقي بعد خصم النقاط. صفرٌ يعني أن النقاط غطّته
    // كاملاً فلا شيء يُدفع عبر البوّابة.
    const payable = Number(order.payableAmount ?? order.totalAmount ?? 0);
    if (!(payable > 0)) {
      throw new BadRequestException('Order has no outstanding balance to pay');
    }

    return payable;
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
        await this.fulfillOrderPayment(intent, transactionId);
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

  /**
   * تسديد طلب عبر شام كاش.
   *
   * كان هذا الفرع فارغاً، فالبوّابة تقبض المال والطلب يبقى «غير مدفوع» —
   * أسوأ من ألّا تُعرض الطريقة أصلاً. المصدر الوحيد لتثبيت الدفع هو هذا
   * المسار: `webhook` موقّع من البوّابة، لا تأكيد يرسله العميل
   * (`VerifyPaymentUseCase` يرفض `cham_cash` صراحةً لهذا السبب).
   */
  private async fulfillOrderPayment(intent: PaymentIntent, gatewayTransactionId: string) {
    if (!intent.targetId) {
      this.logger.error(`Order payment intent ${intent.id} has no targetId; cannot settle`);
      return;
    }

    try {
      // شرط `paymentStatus` في الاستعلام لا فحصٌ قبله: نداءان متزامنان من
      // البوّابة (إعادة محاولة مثلاً) كانا سيسجّلان دخلين للمنصّة على طلب واحد.
      const order = await this.orderModel
        .findOneAndUpdate(
          { _id: intent.targetId, paymentStatus: { $ne: PaymentStatus.COMPLETED } },
          {
            $set: {
              paymentId: gatewayTransactionId,
              paymentMethod: PaymentMethod.CHAM_CASH,
              paymentStatus: PaymentStatus.COMPLETED,
            },
          },
          { new: true },
        )
        .exec();

      if (!order) {
        this.logger.warn(`Order ${intent.targetId} already settled or missing; intent ${intent.id} ignored`);
        return;
      }

      // دخل المنصّة يُسجَّل بالمبلغ المقبوض فعلاً من البوّابة، لا بإجمالي
      // الطلب: النقاط قد تكون خفّضت المستحقّ قبل الدفع.
      if (intent.amount > 0) {
        await this.walletRepository.executeTransaction('platform_earnings', 'system', async (platformWallet) => {
          const balanceBefore = platformWallet.balance;
          platformWallet.deposit(intent.amount);

          const transaction = new Transaction(
            Transaction.generateTransactionNumber(),
            platformWallet.id!,
            platformWallet.ownerId,
            platformWallet.ownerType,
            TransactionType.CREDIT,
            intent.amount,
            balanceBefore,
            platformWallet.balance,
            `Payment for order #${order.orderNumber} via Cham Cash`,
            undefined,
            'order',
            order._id.toString(),
            PaymentMethod.CHAM_CASH,
            gatewayTransactionId,
            'completed',
          );

          return { wallet: platformWallet, transaction };
        });
      }

      this.logger.log(`Order ${order.orderNumber} settled via Cham Cash (intent ${intent.id})`);
    } catch (error) {
      this.logger.error(`Failed to settle order for intent ${intent.id}:`, error);
    }
  }
}
