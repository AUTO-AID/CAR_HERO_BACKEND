import { Injectable, Inject, Logger } from '@nestjs/common';
import type { IWalletRepository } from '../../domain/repositories/wallet.repository.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TransactionType } from '../../../../core/enums/status.enum';
import { Transaction } from '../../domain/entities/transaction.entity';
import { Setting, SettingDocument } from '../../../admin/infrastructure/persistence/mongoose/schemas/setting.schema';

@Injectable()
export class TransferEarningsUseCase {
  private readonly SYSTEM_OWNER_ID = 'platform_earnings';
  private readonly logger = new Logger(TransferEarningsUseCase.name);

  constructor(
    @Inject('IWalletRepository')
    private readonly walletRepository: IWalletRepository,
    @InjectModel(Setting.name)
    private readonly settingModel: Model<SettingDocument>,
  ) {}

  /**
   * @param promotionalCost الإيراد الذي تنازلت عنه المنصّة على هذا الطلب (خصم
   *   نقاط الولاء). يُقيَّد مصروفاً صريحاً — انظر `recordPromotionalCost`.
   * @param custody مَن قبض مال الطلب. الافتراض «المنصّة» حفاظاً على سلوك أي
   *   منادٍ قديم لا يُصرّح — انظر `settleCashCollectedOrder`.
   */
  async execute(
    providerId: string,
    grossAmount: number,
    referenceId: string,
    referenceType: 'order',
    promotionalCost = 0,
    custody: { platformHoldsPayment?: boolean } = {},
  ): Promise<void> {
    const platformHoldsPayment = custody.platformHoldsPayment ?? true;
    const { commissionRate, currency } = await this.getFinancialSettings();
    const commission = grossAmount * commissionRate;
    const netAmount = grossAmount - commission;

    /**
     * 🛡️ حارس التكرار — **كان ميتاً**.
     *
     * الشرط كان يضمّ `type: 'deposit'`، و`'deposit'` ليست قيمةً في
     * `TransactionType` إطلاقاً: إنّها مفردة أوامر `executeMultiWalletTransaction`
     * وحدها، وهو يترجمها إلى `TransactionType.CREDIT` قبل الحفظ
     * (`mongoose-wallet.repository.ts`). وحقلُ `type` في المخطّط مقيَّد بالتعداد
     * (`enum: TransactionType`)، فلا وثيقة في القاعدة تحمل `'deposit'` — أي أن
     * الاستعلام لا يُطابق شيئاً أبداً و`existing.total` صفرٌ دائماً.
     *
     * فلم يكن ثمّة حارس: كل نداء إتمام يُنشئ قيداً جديداً. ومع مرور
     * `completed → completed` في آلة الحالة (انظر `assertTransition`) كان
     * `PATCH /orders/:id/status` المكرّر **يدفع أجر الفنّي من جديد في كل مرّة**.
     * ويعتمد عليه أيضاً تعليقُ `OrdersCronService` الذي يَعِد بأن التأكيد
     * التلقائي «يحرسه فحص المعاملة هنا» — وهو وعدٌ كان باطلاً.
     *
     * وأُسقط قيدُ `type` بدل تصحيحه إلى `'credit'`: قيدُ التسوية قد يكون مديناً
     * لا دائناً (النقد أدناه)، والمقصود «هل سُوّي هذا الطلب لهذا الفنّي؟» أيّاً
     * كان اتجاه القيد. و`ownerType: 'provider'` يُقصي قيدَي المنصّة (العمولة
     * والدعم الترويجي) فلا يتلبّس أحدهما بالآخر.
     */
    const existing = await this.walletRepository.findAllTransactions({
      referenceId,
      referenceType,
      ownerType: 'provider',
    }, 0, 1);

    if (existing.total > 0) {
      this.logger.warn(`Earnings already settled for ${referenceType} ${referenceId}. Skipping.`);
      return;
    }

    if (platformHoldsPayment) {
      await this.walletRepository.executeMultiWalletTransaction([
        // 1. Credit Provider (Net amount)
        {
          ownerId: providerId,
          ownerType: 'provider',
          amount: netAmount,
          type: 'deposit',
          description: `Earnings from ${referenceType} #${referenceId} (${commissionRate * 100}% commission deducted: ${commission} ${currency})`,
          referenceType,
          referenceId,
        },
        // 2. Credit Platform (Commission)
        {
          ownerId: this.SYSTEM_OWNER_ID,
          ownerType: 'system',
          amount: commission,
          type: 'deposit',
          description: `Commission from ${referenceType} #${referenceId} (Provider: ${providerId}, ${commission} ${currency})`,
          referenceType,
          referenceId,
        }
      ]);
    } else {
      await this.settleCashCollectedOrder(providerId, commission, referenceId, referenceType, currency);
    }

    await this.recordPromotionalCost(promotionalCost, referenceId, referenceType, currency);
  }

  /**
   * **تسوية طلبٍ قبض الفنّي مالَه بيده** — النقد وما يجري مجراه.
   *
   * `order-payment-custody.ts` يُعرّف الحيازة في جدول صريح: `cash` ← «جيب
   * الفنّي» ← «لا نملك ردّه». لكنّ ذلك التعريف كان مُستشاراً في موضع واحد
   * (`CancelOrderUseCase`)، ومسارُ الأرباح لا يسأله — فيُودع `netAmount` في
   * محفظة الفنّي مهما كانت الطريقة.
   *
   * والنتيجة أن الفنّي **يُقبض مرّتين على العمل الواحد**: عشرة آلاف نقداً من
   * العميل، وتسعة آلاف رصيداً من المنصّة. وهو رصيد قابل للسحب فعلاً —
   * `RequestPayoutUseCase` لا يفحص إلا `wallet.balance` — ولا سطر في المنظومة
   * يخصم منه النقدَ الذي قبضه:
   *
   * | طلب ١٠٬٠٠٠ نقداً، عمولة ١٠٪ | كان | صار |
   * |---|---|---|
   * | `platform_earnings` | +١١٬٠٠٠ (قبضت صفراً) | +١٬٠٠٠ (مستحقّ) |
   * | محفظة الفنّي | +٩٬٠٠٠ | −١٬٠٠٠ |
   * | صافي مركز الفنّي | ١٩٬٠٠٠ ✗ | ٩٬٠٠٠ ✔ |
   *
   * فالمقلوب هو الصحيح: لا صافيَ يُودَع، بل **عمولةٌ تُستحقّ على الفنّي**. وهو
   * قيدٌ واحد لا اثنان — الفرق بين خصم الإجمالي وإيداع الصافي هو العمولة نفسها.
   *
   * و`allowNegative` ضرورة لا تسهيل: محفظة الفنّي قد تكون فارغة لحظة الاستحقاق،
   * و`withdraw` كان يرمي فيُفشل **إتمام الطلب كلَّه**. والرصيد السالب يمنع السحب
   * من تلقاء نفسه (`RequestPayoutUseCase` يفحص `wallet.balance < amount`) فلا
   * يُبنى حارس ثانٍ. وهو القرار نفسه الذي اتّخذه `recordPromotionalCost`.
   */
  private async settleCashCollectedOrder(
    providerId: string,
    commission: number,
    referenceId: string,
    referenceType: 'order',
    currency: string,
  ): Promise<void> {
    // عمولة صفر (معدّل صفر) لا تحتاج قيداً — لكنّها تحتاج أثراً يمنع التكرار،
    // وهو ما يوفّره قيدُ الطلب نفسه حين تكون العمولة موجبة. مع الصفر لا مال
    // ينتقل في الحالتين فلا ضرر في تخطّيه.
    if (!Number.isFinite(commission) || commission <= 0) return;

    await this.walletRepository.executeMultiWalletTransaction([
      {
        ownerId: providerId,
        ownerType: 'provider',
        amount: commission,
        type: 'withdraw',
        allowNegative: true,
        description: `Commission owed on cash-collected ${referenceType} #${referenceId} (${commission} ${currency} — collected in cash by the provider)`,
        referenceType,
        referenceId,
      },
      {
        ownerId: this.SYSTEM_OWNER_ID,
        ownerType: 'system',
        amount: commission,
        type: 'deposit',
        description: `Commission receivable from ${referenceType} #${referenceId} (Provider: ${providerId}, cash-collected, ${commission} ${currency})`,
        referenceType,
        referenceId,
      },
    ]);
  }

  /**
   * قيد المصروف الترويجي — **الوجه المالي لسياسة «الأساس هو الإجمالي»**.
   *
   * الفنّي يُحتسب على إجمالي الطلب ولو خفّضت نقاطُ الولاء ما قبضته المنصّة،
   * وذاك قرار عمل مقصود (انظر `order-earnings-base.ts`). لكنه كان **بلا قيد**:
   * تُسجَّل عمولةٌ على إجمالٍ لم يُقبض فتُظهر الدفاتر ربحاً حيث الواقع خسارة،
   * ولا يُعرف حجم الدعم المتراكم إلا بجمع يدوي على الطلبات.
   *
   * **خارج المعاملة الذرّية أعلاه عمداً.** `withdraw` يرمي عند نقص الرصيد،
   * وضمّه إلى الدفعة كان يجعل قيداً محاسبياً قادراً على **إلغاء أجر الفنّي** —
   * وهو أسوأ ما يمكن أن يفعله سطر في دفتر. الأجر يُدفع أولاً، ثم يُقيَّد الدعم
   * ولا يُفشل شيئاً إن تعذّر.
   *
   * والرصيد يُنقص يدوياً لا عبر `withdraw`: حارس «الرصيد غير كافٍ» يمنع تسجيل
   * الحالة التي يهمّ تسجيلها أكثر من غيرها — أن يتجاوز الدعمُ ما جمعته المنصّة.
   * السالب هنا معلومة لا خطأ.
   */
  private async recordPromotionalCost(
    amount: number,
    referenceId: string,
    referenceType: 'order',
    currency: string,
  ): Promise<void> {
    if (!Number.isFinite(amount) || amount <= 0) return;

    try {
      await this.walletRepository.executeTransaction(this.SYSTEM_OWNER_ID, 'system', async (wallet) => {
        const balanceBefore = wallet.balance;
        wallet.balance = balanceBefore - amount;

        const transaction = new Transaction(
          Transaction.generateTransactionNumber(),
          wallet.id!,
          wallet.ownerId,
          wallet.ownerType,
          TransactionType.DEBIT,
          amount,
          balanceBefore,
          wallet.balance,
          `Loyalty discount absorbed by the platform on ${referenceType} #${referenceId} (${amount} ${currency})`,
          undefined,
          referenceType,
          referenceId,
          undefined,
          undefined,
          'completed',
          { promotionalCost: true, reason: 'loyalty_discount' },
        );

        return { wallet, transaction };
      });
    } catch (error: any) {
      this.logger.error(
        `Promotional-cost entry failed for ${referenceType} ${referenceId} (${amount} ${currency}): ${error?.message ?? error}`,
      );
    }
  }

  private async getFinancialSettings() {
    const rows = await this.settingModel.find({ key: { $in: ['commission_rate', 'default_currency'] } }).lean().exec();
    const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    const parsedRate = Number(values.commission_rate ?? 0.1);
    const commissionRate = Number.isFinite(parsedRate) && parsedRate >= 0 && parsedRate <= 1 ? parsedRate : 0.1;
    return { commissionRate, currency: String(values.default_currency ?? 'SYP') };
  }
}
