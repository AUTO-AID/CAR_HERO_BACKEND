import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { OfferStatus } from '../../domain/entities/request-offer.entity';
import { IRequestOfferRepository } from '../../domain/repositories/request-offer.repository.interface';
import { ProviderDispatchService } from '../../application/services/provider-dispatch.service';

const SWEEP_INTERVAL_MS = 5_000;
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
          // النافذة ثلث ما تبقّى قبل الموعد (وخمس دقائق على الأقل): يبقى
          // بعدها متّسع لإيجاد بديل إن لم يؤكّد الفنّي المُسنَد.
          const windowSeconds = Math.max(300, Math.floor((booking.minutesUntil * 60) / 3));
          await this.dispatch.openBookingConfirmation(booking.orderId, windowSeconds);
        } catch (error: any) {
          this.logger.error(`Booking confirmation for ${booking.orderId} failed: ${error?.message ?? error}`);
        }
      }

      this.logger.log(`Requested confirmation for ${due.length} booking(s)`);
    } catch (error: any) {
      this.logger.error(`Booking confirmation pass failed: ${error?.message ?? error}`);
    } finally {
      this.bookings = false;
    }
  }
}
