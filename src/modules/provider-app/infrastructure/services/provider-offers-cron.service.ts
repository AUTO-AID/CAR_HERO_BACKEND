import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { OfferStatus } from '../../domain/entities/request-offer.entity';
import { IRequestOfferRepository } from '../../domain/repositories/request-offer.repository.interface';
import { ProviderDispatchService } from '../../application/services/provider-dispatch.service';

// ثلاث ثوانٍ لا خمس: الطريق السريع هو التطبيق نفسه، وكلّما سقط (هاتف مُقفَل أو
// شبكة منقطعة عند انتهاء العدّاد) صار هذا الفاصل هو ما يُضاف إلى انتظار العميل
// قبل انتقال الطلب إلى الفنّي التالي. الاستعلام مفهرس على (status, expiresAt)
// فكلفة تكراره لا تُذكر أمام ما يوفّره من ثوانٍ على الطريق.
const SWEEP_INTERVAL_MS = 3_000;
const SWEEP_BATCH = 50;

const RESUME_INTERVAL_MS = 15_000;
const RESUME_BATCH = 25;

const BOOKING_INTERVAL_MS = 60_000;
const BOOKING_BATCH = 25;

/**
 * المهامّ الدورية لتوزيع الطلبات.
 *
 * ثلاث مهامّ لا واحدة، وكلٌّ منها تحرس عطلاً مختلفاً:
 *
 * ١ · **مسح المهل** — الطريق السريع هو التطبيق نفسه (يُبلّغ عند انتهاء
 *     العدّاد)، لكنه قد يُقفل أو تنقطع شبكته في اللحظة ذاتها فلا يحرّك الطلبَ
 *     أحد.
 * ٢ · **استئناف البحث** — الجولة المستنفدة تنام دقيقة ثم تُستأنف؛ بلا هذه
 *     المهمّة تنام إلى الأبد.
 * ٣ · **تأكيد الحجوزات** — الحجز المُسند بلا قبول صريح قد يكون الفنّي نسيه،
 *     فيُطلب تأكيده قبل الموعد بوقت يكفي لإيجاد بديل.
 */
@Injectable()
export class ProviderOffersCronService {
  private readonly logger = new Logger(ProviderOffersCronService.name);

  /**
   * ⚠️ **هذه أقفال داخل العملية الواحدة — والتوزيع يفترض نسخة واحدة من الخادم.**
   *
   * كلٌّ منها يمنع تراكب المهمّة مع **نفسها** في هذه العملية، ولا يعرف شيئاً عن
   * عملية أخرى. و NestJS يجدول المهامّ في كل نسخة، فتشغيل نسختين يعني تشغيل كل
   * مهمّة مرّتين في اللحظة نفسها.
   *
   * `sweepExpiredOffers` تحتمل ذلك (إغلاق العرض ذرّي)، و`openDueBookingConfirmations`
   * يحرسها فهرس التفرّد. أمّا **`resumeDueSearches` فلا حارس لها**: نسختان
   * تقرآن `nextRoundAt` قبل أن تمحوه إحداهما، فتختار كلٌّ فنّياً **مختلفاً**
   * وتفتح له عرضاً — وفهرس `(طلب، فنّي، جولة)` لا يمنعهما لأن الفنّيين مختلفان.
   * فيعود بالضبط العطل الذي بُني نظام الجولات لمنعه: عدّادان على طلب واحد،
   * وصاحب الإسناد المدهوس يُرفض قبوله بـ409.
   *
   * قبل أي توسّع أفقي: استبدلها بحجز في قاعدة البيانات (`findOneAndUpdate` ذرّي
   * على `dispatchLockUntil` بمهلة انتهاء) — قبل إضافة النسخة الثانية لا بعدها.
   * التفصيل في §25.1 من `CAR_HERO_BACKEND_README.md`.
   */
  private sweeping = false;
  private resuming = false;
  private bookings = false;

  constructor(
    @Inject(IRequestOfferRepository)
    private readonly offers: IRequestOfferRepository,
    private readonly dispatch: ProviderDispatchService,
    private readonly config: ConfigService,
  ) {}

  @Interval(SWEEP_INTERVAL_MS)
  async sweepExpiredOffers() {
    // دورة بطيئة (إعادة توزيع تعني استعلامات جغرافية) قد تتجاوز الفاصل؛
    // القفل يمنع تراكب دورتين على العروض نفسها.
    if (this.sweeping) return;
    this.sweeping = true;

    try {
      const expired = await this.offers.findExpired(new Date(), SWEEP_BATCH);
      if (!expired.length) return;

      for (const offer of expired) {
        try {
          await this.dispatch.closeAndRedispatch(offer, OfferStatus.EXPIRED, 'انقضت مهلة الرد');
        } catch (error: any) {
          this.logger.error(`Expiring offer ${offer.id} failed: ${error?.message ?? error}`);
        }
      }

      this.logger.log(`Swept ${expired.length} expired offer(s)`);
    } catch (error: any) {
      this.logger.error(`Offer sweep failed: ${error?.message ?? error}`);
    } finally {
      this.sweeping = false;
    }
  }

  /**
   * استئناف البحث النائم.
   *
   * حين تُستنفد جولة (لا مرشّح متّصل على أي نصف قطر) لا يُلغى الطلب: تُجدول
   * جولة تالية بعد دقيقة، لأن قائمة المرشّحين تتغيّر باستمرار — فنّي ينهي
   * طلباً وآخر يفتح التطبيق.
   */
  @Interval(RESUME_INTERVAL_MS)
  async resumeDueSearches() {
    if (this.resuming) return;
    this.resuming = true;

    try {
      const orderIds = await this.dispatch.findOrdersDueForNextRound(RESUME_BATCH);
      if (!orderIds.length) return;

      for (const orderId of orderIds) {
        try {
          await this.dispatch.resumeSearch(orderId);
        } catch (error: any) {
          this.logger.error(`Resuming search for order ${orderId} failed: ${error?.message ?? error}`);
        }
      }

      this.logger.log(`Resumed ${orderIds.length} dispatch search(es)`);
    } catch (error: any) {
      this.logger.error(`Search resume pass failed: ${error?.message ?? error}`);
    } finally {
      this.resuming = false;
    }
  }

  /**
   * الحجوزات المجدولة التي اقترب موعدها.
   *
   * الحجز يُسند عند إنشائه بلا مهلة ردّ — لا معنى لعدّاد نصف دقيقة على موعد
   * بعد ثلاثة أيام — لكنه يبقى بلا **قبول صريح**، والفنّي قد يكون نسيه. قبل
   * الموعد بمهلة كافية يتحوّل إلى عرض حقيقي بنافذة طويلة، فيسري عليه مسار
   * القبول/الرفض نفسه ويُعاد توزيعه إن لم يؤكّد وما زال في الوقت متّسع.
   */
  @Interval(BOOKING_INTERVAL_MS)
  async openDueBookingConfirmations() {
    if (this.bookings) return;
    this.bookings = true;

    try {
      const leadMinutes = this.config.get<number>('providerApp.bookingConfirmLeadMinutes') ?? 90;
      const due = await this.dispatch.findBookingsAwaitingConfirmation(leadMinutes, BOOKING_BATCH);
      if (!due.length) return;

      for (const booking of due) {
        try {
          if (booking.hasProvider) {
            // النافذة ثلث ما تبقّى قبل الموعد (وخمس دقائق على الأقل): يبقى
            // بعدها متّسع لإيجاد بديل إن لم يؤكّد الفنّي المُسنَد.
            const windowSeconds = Math.max(300, Math.floor((booking.minutesUntil * 60) / 3));
            await this.dispatch.openBookingConfirmation(booking.orderId, windowSeconds);
          } else {
            /**
             * حجز يتيم: اعتذر عنه فنّيه. لا شيء يُطلب تأكيده — المطلوب بديل،
             * فيدخل منطق الجولات نفسه (وسقفه المشتقّ من الموعد يُنهيه صراحةً
             * إن لم يوجد أحد، قبل الموعد بوقت يُشعر العميل).
             *
             * ولا حاجة لحارس تكرار: `redispatch` لا يفتح عرضاً فوق عرض حيّ،
             * فالمرور عليه كل دقيقة محاولةٌ إضافية لا قصف.
             */
            await this.dispatch.resumeSearch(booking.orderId);
          }
        } catch (error: any) {
          this.logger.error(`Booking dispatch for ${booking.orderId} failed: ${error?.message ?? error}`);
        }
      }

      const orphaned = due.filter((booking) => !booking.hasProvider).length;
      this.logger.log(
        `Booking pass: ${due.length - orphaned} awaiting confirmation, ${orphaned} seeking replacement`,
      );
    } catch (error: any) {
      this.logger.error(`Booking confirmation pass failed: ${error?.message ?? error}`);
    } finally {
      this.bookings = false;
    }
  }
}
