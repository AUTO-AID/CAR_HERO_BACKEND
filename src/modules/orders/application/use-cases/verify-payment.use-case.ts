import { Inject, Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../domain/entities/order.entity';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../../../../core/enums/status.enum';
import { VerifyPaymentDto } from '../dto/verify-payment.dto';
import type { IWalletRepository } from '../../../../modules/wallet/domain/repositories/wallet.repository.interface';
import { Transaction } from '../../../../modules/wallet/domain/entities/transaction.entity';
import { TransactionType } from '../../../../core/enums/status.enum';
import { isPlatformHeldPayment } from '../../domain/services/order-payment-custody';

@Injectable()
export class VerifyPaymentUseCase {
  private readonly logger = new Logger(VerifyPaymentUseCase.name);

  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    @Inject('IWalletRepository')
    private readonly walletRepository: IWalletRepository,
  ) {}

  async execute(id: string, dto: VerifyPaymentDto, currentUser: any): Promise<OrderEntity> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    /**
     * **العميل ليس من يشهد على دفع نفسه.**
     *
     * النقد يُسلَّم للفنّي عند إتمام الخدمة، فهو القابض وهو من يُقرّ بالقبض —
     * أو الإدارة حين تُسوّي يدوياً. وكان `isOwner` مقبولاً هنا، فيكفي العميلَ
     * نداءٌ واحد بأي `paymentId` يخترعه ليصير طلبه «مدفوعاً» بلا أن يدفع.
     *
     * ولم يكن ذلك ضرراً محاسبياً فحسب: `CancelOrderUseCase` كان يقرأ
     * `paymentStatus = completed` فيودع المبلغ رصيداً حقيقياً في محفظة العميل،
     * فتصير السلسلة «أنشئ ← أعلن الدفع ← ألغِ» مطبعةَ نقودٍ تتكرّر بلا حدّ.
     * أُغلق الطرف الآخر منها في `order-payment-custody.ts` — وهذا طرفها الأول.
     */
    const currentUserId = currentUser?._id?.toString();
    const currentProviderId = currentUser?.providerId?.toString();
    const isAssignedProvider =
      !!order.providerId &&
      ((!!currentProviderId && order.providerId.toString() === currentProviderId) ||
        (!!currentUserId && order.providerId.toString() === currentUserId));
    const isAdmin = currentUser?.role === 'admin';
    if (!isAssignedProvider && !isAdmin) {
      throw new ForbiddenException('You do not have permission to verify payment for this order');
    }

    // Business Rule: Check if payment is already confirmed
    if (order.paymentStatus === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Order is already paid');
    }

    /**
     * لا قبضَ قبل أن تبدأ الخدمة ولا بعد أن تسقط.
     *
     * الطلب `pending` لم يقبله أحد بعد — والفنّي المُسنَد إليه مجرّد مرشّح
     * تُفتح له نافذة عرض، فإقراره بقبض نقدٍ لم يلتقِ صاحبه بعدُ لا معنى له.
     * والملغى/المرفوض أسوأ: تثبيت الدفع عليه يفتح باب الاسترجاع على طلب مات.
     */
    if (order.status === OrderStatus.PENDING) {
      throw new BadRequestException('Payment cannot be recorded before the order is accepted');
    }
    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REJECTED) {
      throw new BadRequestException('Payment cannot be recorded for a cancelled or rejected order');
    }

    // شام كاش لا يُثبَّت بكلمة العميل: البوّابة هي من تُبلّغ عبر webhook موقّع.
    // قبول تأكيد مباشر هنا يعني «دفعتُ» بلا دفع.
    if (dto.paymentMethod === PaymentMethod.CHAM_CASH) {
      throw new BadRequestException('Cham Cash payments must be processed via the /api/payments/initialize endpoint. Direct verification is disabled.');
    }

    // Future: Add real gateway verification logic here if needed

    const updatedOrder = await this.orderRepository.updatePaymentDetails(id, dto.paymentId, dto.paymentMethod);

    /**
     * 💰 دخل المنصّة — **لما قبضته المنصّة وحده**.
     *
     * كان الشرط `total > 0 && userId` بلا نظرٍ في طريقة الدفع، فيودع الإجمالي في
     * `platform_earnings` على طلبٍ نقديٍّ لم يصل المنصّةَ منه شيء. والنقد هو
     * الطريقة الافتراضية (`updatePaymentDetails` يكتب `CASH` عند غيابها) — أي أن
     * القيد الوهمي كان القاعدة لا الاستثناء.
     *
     * والحيازة تُقرأ من **الطلب بعد التحديث** لا من `dto`: الأخير قد يصل بلا
     * طريقة، والمستودع يحسم الغياب إلى `CASH` — فقراءة `dto` وحدها كانت تُصنّف
     * ذلك الطلب على أنه ليس نقداً وهو نقد.
     *
     * وطرفُ الأرباح من المسألة نفسها في `TransferEarningsUseCase`
     * (`settleCashCollectedOrder`): هناك تُستحقّ العمولة على الفنّي، وهنا لا
     * يُقيَّد دخلٌ لم يُقبض. والحارس الذي يعرّف الحيازة قائمٌ منذ
     * `order-payment-custody.ts` — وكان مُستشاراً في الإلغاء وحده.
     */
    const platformHoldsTheMoney = isPlatformHeldPayment(updatedOrder.paymentMethod);

    if (!platformHoldsTheMoney) {
      // أثرٌ صريح بدل قيدٍ كاذب: النقد قبضه الفنّي، وتسويته تجري عبر خصم
      // العمولة عند الإتمام. نمطُ `metadata.cancellation.offPlatformSettlement`
      // نفسه في `CancelOrderUseCase`.
      await this.orderRepository.update(id, {
        'metadata.payment.offPlatformCustody': {
          paymentMethod: updatedOrder.paymentMethod ?? null,
          amount: updatedOrder.total,
          collectedBy: 'provider',
          recordedAt: new Date(),
        },
      } as any);
      this.logger.log(
        `Order ${updatedOrder.orderNumber} marked paid via ${updatedOrder.paymentMethod} ` +
          `(${updatedOrder.total}) — collected off-platform, no platform credit issued.`,
      );
    }

    // 💰 Transaction Record: Document the customer payment in the system
    if (platformHoldsTheMoney && updatedOrder.total > 0 && updatedOrder.userId) {
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
