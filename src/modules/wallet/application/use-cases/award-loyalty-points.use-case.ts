import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TransactionType } from '../../../../core/enums/status.enum';
import { Setting, SettingDocument } from '../../../admin/infrastructure/persistence/mongoose/schemas/setting.schema';
import { Order, OrderDocument } from '../../../orders/infrastructure/persistence/mongoose/schemas/order.schema';
import {
  LOYALTY_POINTS_RATE_SETTING,
  pointsEarnedOn,
  pointsToCurrency,
  resolveLoyaltyRate,
} from '../../domain/services/loyalty-policy';
import {
  Transaction,
  TransactionDocument,
  Wallet,
  WalletDocument,
} from '../../infrastructure/persistence/mongoose/schemas/wallet.schema';

/**
 * منح نقاط الولاء عند إتمام الطلب — **الطرف الغائب من الاقتصاد**.
 *
 * الاستبدال كان موجوداً منذ البداية والمنح لم يكن، فالرصيد لا يملأ أبداً. هذه
 * الحالة تُغلق الدائرة: تُنادى من مسارَي الإتمام كليهما، تماماً كما يُنادى
 * `TransferEarningsUseCase` — فلا يتغيّر ما يكسبه العميل بحسب مَن ضغط زرّ
 * الإتمام.
 */
@Injectable()
export class AwardLoyaltyPointsUseCase {
  private readonly logger = new Logger(AwardLoyaltyPointsUseCase.name);

  constructor(
    @InjectModel(Wallet.name) private readonly wallets: Model<WalletDocument>,
    @InjectModel(Transaction.name) private readonly transactions: Model<TransactionDocument>,
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
    @InjectModel(Setting.name) private readonly settings: Model<SettingDocument>,
  ) {}

  /**
   * @param paidAmount ما دفعه العميل فعلاً — لا إجمالي الطلب. انظر `orderLoyaltyBase`.
   */
  async execute(userId: string, paidAmount: number, orderId: string, orderNumber?: string): Promise<void> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(orderId)) return;

    const rate = resolveLoyaltyRate(
      (await this.settings.findOne({ key: LOYALTY_POINTS_RATE_SETTING }).lean().exec())?.value,
    );
    const points = pointsEarnedOn(paidAmount, rate);
    if (points <= 0) return;

    /**
     * الحجز الذرّي قبل أي كتابة على المحفظة.
     *
     * علامةٌ على الطلب نفسه بشرطٍ **داخل** الاستعلام لا فحصاً قبله: مساران
     * يُتمّان الطلب (تأكيد العميل والتأكيد التلقائي) وقد يتسابقان، ومنحُ
     * النقاط مرّتين على طلب واحد يُنشئ نقاطاً من العدم. من يظفر بالعلامة يمنح،
     * ومن يخسرها ينصرف صامتاً.
     *
     * وهو نمط المنظومة نفسه في `fulfillOrderPayment` و`closeIfOpen`.
     */
    const claimed = await this.orders
      .findOneAndUpdate(
        { _id: new Types.ObjectId(orderId), 'metadata.loyaltyPointsAwarded': { $exists: false } },
        { $set: { 'metadata.loyaltyPointsAwarded': points } },
      )
      .exec();

    if (!claimed) return; // مُنحت سلفاً — أو سبقنا إليها مسار آخر

    try {
      const wallet = await this.wallets
        .findOneAndUpdate(
          { ownerId: new Types.ObjectId(userId), ownerType: 'user' },
          { $inc: { loyaltyPoints: points }, $setOnInsert: { balance: 0, pendingBalance: 0, isActive: true } },
          { new: true, upsert: true },
        )
        .exec();

      /**
       * قيدٌ بلا حركة رصيد: النقاط ليست مالاً في المحفظة، والرصيد قبلها وبعدها
       * واحد. `amount` يحمل قيمتها بالعملة كي تُقارَن بقيود الاستبدال في أي
       * تقرير، و`pointsEarned` هو الحقل الذي يميّزها عنها.
       *
       * `referenceType` هنا `order_reward` لا `order`: فهرس التفرّد الجزئي على
       * (مالك، order، طلب، loyalty_points) يحرس **الاستبدال**، وقيدُ المنح
       * بنفس الشكل كان يصطدم به على كل طلبٍ استُبدلت فيه نقاط — فيُمنع المنح
       * بالضبط حيث يجتمع الفعلان.
       */
      await this.transactions.create({
        transactionNumber: `PTS-EARN-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        wallet: wallet._id,
        ownerId: wallet.ownerId,
        ownerType: 'user',
        type: TransactionType.LOYALTY_POINTS,
        amount: pointsToCurrency(points),
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance,
        description: `Earned ${points} loyalty points from order #${orderNumber ?? orderId}`,
        referenceType: 'order_reward',
        referenceId: new Types.ObjectId(orderId),
        pointsEarned: points,
        status: 'completed',
        metadata: { points, rate, paidAmount },
      });
    } catch (error: any) {
      // العلامة تُرفع كي لا يبقى الطلب مُعلَّماً بمنحٍ لم يقع — فتُمنح نقاطه
      // في محاولة لاحقة بدل أن تضيع صامتة.
      await this.orders
        .updateOne({ _id: new Types.ObjectId(orderId) }, { $unset: { 'metadata.loyaltyPointsAwarded': 1 } })
        .exec()
        .catch(() => undefined);

      this.logger.error(
        `Loyalty award failed for order ${orderNumber ?? orderId} (user ${userId}, ${points} pts): ${error?.message ?? error}`,
      );
    }
  }
}
