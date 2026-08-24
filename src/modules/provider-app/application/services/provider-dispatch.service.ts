import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { NotificationType, OrderStatus, ProviderStatus } from '../../../../core/enums/status.enum';
import { calculateDistance } from '../../../../core/utils/geo.util';
import { notificationContent } from '../../../notifications/application/notification-content';
import { NotificationsService } from '../../../notifications/application/services/notifications.service';
import { CancelOrderUseCase } from '../../../orders/application/use-cases/cancel-order.use-case';
import { OrderEntity } from '../../../orders/domain/entities/order.entity';
import { IOrderRepository } from '../../../orders/domain/repositories/order.repository.interface';
import { Order, OrderDocument } from '../../../orders/infrastructure/persistence/mongoose/schemas/order.schema';
import {
  Provider,
  ProviderDocument,
} from '../../../providers/infrastructure/persistence/mongoose/schemas/provider.schema';
import { OfferStatus, RequestOfferEntity } from '../../domain/entities/request-offer.entity';
import {
  OfferClosedEvent,
  OfferClosedReason,
  OfferCreatedEvent,
  ProviderAppEvents,
} from '../../domain/events/provider-app.events';
import { IRequestOfferRepository } from '../../domain/repositories/request-offer.repository.interface';
import { ENGAGING_ORDER_STATUSES } from '../../domain/services/provider-request-flow';
import { ProviderRequestMapper } from '../mappers/provider-request.mapper';

interface Candidate {
  providerId: string;
  distanceMeters?: number;
}

/**
 * ProviderDispatchService — توزيع الطلب على الفنّيين عرضاً بعد عرض
 *
 * الطلب يُنشأ مُسنداً إلى أقرب فنّي (`create-order.use-case`) لكن الإسناد ليس
 * قبولاً: هذه الطبقة تحوّله إلى **عرض** بمهلة، وتعيد التوزيع على التالي عند
 * الرفض أو انقضاء المهلة. بدونها كان الطلب يعلق إلى الأبد عند فنّي لا يردّ.
 *
 * `Order` هو مصدر الحقيقة للحالة؛ ما يُخزَّن هنا هو تاريخ العروض فقط.
 */
@Injectable()
export class ProviderDispatchService {
  private readonly logger = new Logger(ProviderDispatchService.name);

  constructor(
    @Inject(IRequestOfferRepository)
    private readonly offers: IRequestOfferRepository,
    @Inject(IOrderRepository)
    private readonly orders: IOrderRepository,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Provider.name)
    private readonly providerModel: Model<ProviderDocument>,
    private readonly notifications: NotificationsService,
    private readonly events: EventEmitter2,
    private readonly config: ConfigService,
    private readonly cancelOrder: CancelOrderUseCase,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  get offerWindowSeconds(): number {
    return this.config.get<number>('providerApp.offerWindowSeconds') ?? 45;
  }

  /** سقف العروض داخل الجولة الواحدة — يمنع حرق عشرين فنّياً في دقيقتين */
  private get maxAttemptsPerRound(): number {
    return this.config.get<number>('providerApp.maxDispatchAttempts') ?? 5;
  }

  /** أنصاف الأقطار بالترتيب: الأقرب أولاً، ولا نتّسع إلا عند الفراغ */
  private get radiiMeters(): number[] {
    const radii = this.config.get<number[]>('providerApp.dispatchRadiiKm');
    return (radii?.length ? radii : [10, 20, 30]).map((km) => km * 1000);
  }

  private get roundIntervalMs(): number {
    return (this.config.get<number>('providerApp.roundIntervalSeconds') ?? 60) * 1000;
  }

  private get searchDeadlineMs(): number {
    return (this.config.get<number>('providerApp.searchDeadlineMinutes') ?? 10) * 60_000;
  }

  /** أقرب لحظة قبل الموعد يبقى البحث عن بديل للحجز مجدياً عندها */
  private get bookingFloorMs(): number {
    return (this.config.get<number>('providerApp.bookingDispatchFloorMinutes') ?? 30) * 60_000;
  }

  /**
   * متى يتوقّف البحث — والمسطرة تختلف باختلاف الطلب.
   *
   * الفوري يُقاس بما مضى: العميل واقف الآن وعشر دقائق حدّ صبره.
   * والحجز يُقاس بما بقي: موعده ثابت، فسقفٌ محسوب من لحظة بدء البحث لا معنى
   * له. وكان يُقاس بمسطرة الفوري، فيُلغى كل حجز لم يؤكَّد حتماً — نافذة التأكيد
   * ثلث ما تبقّى (نصف ساعة عادةً) وهي تتجاوز العشر دقائق دائماً، فيقع الإلغاء
   * وأمام الحجز ساعة كاملة كانت تكفي لإيجاد بديل.
   */
  private dispatchDeadlineMs(order: OrderEntity, plan: { startedAt: Date }): number {
    if (order.isScheduled && order.scheduledAt) {
      const scheduled = new Date(order.scheduledAt).getTime();
      // موعد فاسد يُقرأ بمسطرة الفوري لا بـNaN: الأخير يجعل كل مقارنة معه
      // كاذبة، فلا يتوقّف البحث أبداً.
      if (!Number.isNaN(scheduled)) return scheduled - this.bookingFloorMs;
    }
    return plan.startedAt.getTime() + this.searchDeadlineMs;
  }

  /**
   * نافذة الردّ على عرض حجز — ثلث ما تبقّى قبل الموعد، وخمس دقائق على الأقل.
   *
   * نافذة الطلب الفوري (٤٥ ثانية) لا تصلح هنا: الفنّي لم يكن ينتظر إشعاراً في
   * تلك اللحظة، والمطلوب منه تأكيدٌ لا سباق. والثلث يُبقي بعده متّسعاً لمحاولة
   * أخرى إن لم يؤكّد.
   */
  private bookingWindowSeconds(order: OrderEntity): number | undefined {
    if (!order.isScheduled || !order.scheduledAt) return undefined;
    const msUntil = new Date(order.scheduledAt).getTime() - Date.now();
    if (!Number.isFinite(msUntil) || msUntil <= 0) return undefined;
    return Math.max(300, Math.floor(msUntil / 3000));
  }

  // ===========================================
  // ENTRY POINTS
  // ===========================================

  /**
   * طلب جديد وصل. الفنّي المُسنَد سلفاً هو المرشّح الأول — لا نعيد البحث كي لا
   * نناقض القرار الذي بُني عليه سعر الطلب.
   */
  async dispatchNewOrder(orderId: string): Promise<void> {
    const order = await this.orders.findById(orderId);
    if (!order || order.status !== OrderStatus.PENDING) return;

    // بدء ساعة البحث. من هنا تُحسب مهلة السقف الكلّي.
    await this.writePlan(orderId, { startedAt: new Date(), round: 1, nextRoundAt: null });

    if (order.providerId) {
      const existing = await this.offers.findOpenForOrderAndProvider(orderId, order.providerId);
      if (existing) return; // حدث مكرّر — العرض قائم أصلاً

      // الإسناد الأوّلي يأتي من `create-order` الذي يختار الأقرب غير المنشغل —
      // **ولو كان غير متّصل**. احترام هذا الإسناد بلا فحص كان يفتح ثغرة في
      // قاعدة «المتّصلون فقط»: العرض الأوّل يذهب لفنّي أغلق تطبيقه، فتُحرق
      // نافذة كاملة قبل أن يبدأ البحث الحقيقي. من لم يكن متّصلاً يُترك
      // للتوزيع العادي الذي يحترم القاعدة.
      const [assignee, heldOffer] = await Promise.all([
        this.providerModel.findById(order.providerId).select('status').lean().exec(),
        // ومن يقرّر الآن في عرض آخر ليس أهلاً للمسار السريع: هذا المسار يتخطّى
        // `findNextCandidate` بكل استبعاداته، فكان بابه الخلفي يُدخل الطلبَ على
        // فنّي يحمل عرضاً حيّاً — فيستبدله على شاشته ويُعيد عدّاده من أوّله.
        this.offers.findOpenForProvider(order.providerId),
      ]);

      if (assignee?.status === ProviderStatus.ONLINE && !heldOffer) {
        await this.openOffer(order, { providerId: order.providerId }, 1, 1);
        return;
      }

      await this.orderModel.findByIdAndUpdate(orderId, { $unset: { provider: '' } }).exec();
    }

    await this.redispatch(orderId);
  }

  /**
   * عرض تأكيد لحجز مجدول اقترب موعده. نافذته أطول بكثير من عرض الطلب الفوري
   * (تُمرَّر من المهمّة الدورية) لأن الفنّي لم يكن ينتظر إشعاراً في تلك اللحظة.
   */
  async openBookingConfirmation(orderId: string, windowSeconds: number): Promise<boolean> {
    const order = await this.orders.findById(orderId);
    if (!order || order.status !== OrderStatus.PENDING) return false;

    // حجزٌ بلا فنّي: اعتذر عنه صاحبه. لا شيء يُطلب تأكيده — المطلوب بديل.
    if (!order.providerId) {
      await this.redispatch(orderId);
      return false;
    }

    const existing = await this.offers.findOpenForOrderAndProvider(orderId, order.providerId);
    if (existing) return false;

    // العلامة تُكتب قبل العرض لا بعده: لو كُتبت بعده وفشل الإشعار، أعادت
    // المهمّة الدورية المحاولة كل دقيقة بلا سقف.
    await this.orderModel
      .findByIdAndUpdate(orderId, { $set: { 'metadata.booking.confirmationRequestedAt': new Date() } })
      .exec();

    await this.writePlan(orderId, { startedAt: new Date(), round: 1, nextRoundAt: null });
    await this.openOffer(order, { providerId: order.providerId }, 1, 1, windowSeconds);
    return true;
  }

  /**
   * اعتذار الفنّي عن حجز مجدول قبل الموعد بوقت كافٍ.
   *
   * ليس رفضاً لعرضٍ قائم: الحجز مُسند بلا عرض حتى تقترب ساعته، فلا يوجد ما
   * يُغلق. نفكّ الإسناد ونترك التوزيع لدورة التأكيد التالية، فيجد الطلب فنّياً
   * آخر قبل الموعد.
   */
  async releaseBooking(orderId: string, providerId: string, reason?: string): Promise<void> {
    await this.orderModel
      .findByIdAndUpdate(orderId, {
        $unset: { provider: '', 'metadata.booking.confirmationRequestedAt': '' },
        /**
         * قائمة تتراكم لا قيمة تُستبدل.
         *
         * المعتذِر يجب أن يُستبعد من كل بحث لاحق على هذا الحجز، والاستبعاد
         * المعتاد (`findExcludedProviderIds`) لا يراه: الاعتذار يقع قبل الموعد
         * بأيام حين لا عرض مفتوح أصلاً، فلا يبقى منه سجلّ عرض بحالة `rejected`.
         * وبقيمة مفردة كان ثاني معتذِر يمحو أوّلهم فيعود مرشّحاً لحجزٍ رفضه.
         */
        $addToSet: { 'metadata.booking.declinedProviders': providerId },
        $set: { 'metadata.booking.declineReason': reason ?? null },
      })
      .exec();

    /**
     * `GetOrderByIdUseCase` يخزّن الطلب خمس دقائق، وهذه كتابة مباشرة لا تمرّ به.
     *
     * وبدون الإبطال كان العميل يفتح تفاصيل حجزه فيرى **اسم الفنّي الذي اعتذر
     * للتوّ** — لا لثوانٍ بل حتى تنتهي مدّة الكاش. وهي الحالة الوحيدة الحتمية
     * من نوعها: شاشة الحجز لا تستطلع دورياً (الاستطلاع للطلب الفوري وحده)،
     * فلا شيء يصحّح الصورة قبل انقضاء المدّة.
     */
    await this.cache.del(`order_${orderId}`);

    this.logger.log(`Booking ${orderId} released by provider ${providerId}`);
  }

  /** رفض الفنّي أو انقضت مهلته → التالي في القائمة */
  async closeAndRedispatch(
    offer: RequestOfferEntity,
    status: OfferStatus.REJECTED | OfferStatus.EXPIRED,
    reason?: string,
  ): Promise<boolean> {
    const closed = await this.offers.closeIfOpen(offer.id, { status, reason });
    if (!closed) return false; // سبقنا إليه فعل آخر (قبول أو إلغاء)

    // نُفرّق بين الرفض الصريح وانقضاء المهلة عمداً: الرفض **سلوك جيّد** يعيد
    // توزيع الطلب في نفس اللحظة، بينما ترك العدّاد ينقضي يُبقي العميل ينتظر.
    // كلاهما يُسجَّل للمراجعة ولا يُعاقَب عليه آلياً — معاقبة الرفض تدفع إلى
    // «القبول ثم الإلغاء»، وهو أسوأ للعميل بكثير.
    await this.bumpProviderCounter(
      offer.providerId,
      status === OfferStatus.REJECTED ? 'offersRejected' : 'offersExpired',
    );

    this.events.emit(
      ProviderAppEvents.OFFER_CLOSED,
      new OfferClosedEvent(
        offer.providerId,
        offer.id,
        offer.orderId,
        status === OfferStatus.REJECTED ? 'rejected' : 'expired',
      ),
    );

    await this.redispatch(offer.orderId);
    return true;
  }

  /**
   * أُغلق باب العرض على هذا الطلب (قُبل أو أُلغي). كل عرض مفتوح آخر يجب أن
   * يختفي من شاشة صاحبه فوراً — لا أن يبقى عدّاده يدور على طلب لم يعد متاحاً.
   */
  /** يُنادى من مسار القبول: العرض أُغلق «مقبولاً» فعلاً */
  async recordAcceptance(providerId: string): Promise<void> {
    await this.bumpProviderCounter(providerId, 'offersAccepted');
  }

  async closeOpenOffers(orderId: string, reason: OfferClosedReason, exceptOfferId?: string): Promise<void> {
    const open = (await this.offers.findOpenForOrder(orderId)).filter((offer) => offer.id !== exceptOfferId);
    if (!open.length) return;

    await this.offers.closeAllOpenForOrder(orderId, { status: OfferStatus.CANCELLED, reason });

    for (const offer of open) {
      this.events.emit(
        ProviderAppEvents.OFFER_CLOSED,
        new OfferClosedEvent(offer.providerId, offer.id, orderId, reason),
      );
    }
  }

  // ===========================================
  // CORE
  // ===========================================

  /**
   * محاولة واحدة داخل الجولة الجارية.
   *
   * الجولة = مرور كامل على أنصاف الأقطار. حين تُستنفد (لا مرشّح على أي نصف
   * قطر، أو بلغت سقف محاولاتها) **لا نستسلم**: نجدول جولة تالية بعد دقيقة،
   * لأن قائمة المرشّحين تتغيّر باستمرار — فنّي ينهي طلباً، وآخر يفتح التطبيق.
   * الاستسلام لا يقع إلا عند سقف البحث الكلّي.
   */
  private async redispatch(orderId: string): Promise<void> {
    const order = await this.orders.findById(orderId);
    if (!order || order.status !== OrderStatus.PENDING) return;

    /**
     * عرضٌ مفتوح على الطلب يعني أن فنّياً يقرّر الآن داخل مهلته — ولا يُفتح
     * عرض ثانٍ فوقه.
     *
     * كل مسار يستدعي هذه الدالّة يُغلق عرضه **قبل** النداء (رفضاً أو انتهاءَ
     * مهلة)، فالوصول إلى هنا وعرضٌ ما يزال مفتوحاً يعني أن مساراً آخر سبقنا.
     * والمضيّ عندئذ كان يفتح عرضاً ثانياً ويُعيد إسناد الطلب إلى صاحبه، فيصير
     * قبول الأول مرفوضاً بـ409 وعدّاده يدور على طلب لم يعد له.
     *
     * المنتهية مهلتها لا تحجب: `isOpen` يشترط سريان المهلة، فعرضٌ مات ولم يمرّ
     * عليه المسح بعد لا يوقف البحث — والمسح يُغلقه خلال ثوانٍ ويعيد النداء.
     */
    const offersOnOrder = await this.offers.findOpenForOrder(orderId);
    if (offersOnOrder.some((offer) => offer.isOpen())) return;

    const plan = this.readPlan(order);

    if (Date.now() > this.dispatchDeadlineMs(order, plan)) {
      await this.abandon(order, 'انقضى سقف البحث دون فنّي متاح');
      return;
    }

    /**
     * الجولة استُؤنفت فعلاً، فموعدها المعلّق لم يعد له معنى.
     *
     * بدون هذا المحو كان `metadata.dispatch.nextRoundAt` يبقى في الماضي إلى
     * الأبد، فتلتقط المهمّة الدورية الطلبَ نفسه **كل خمس عشرة ثانية** وتفتح
     * عرضاً جديداً على فنّي جديد فوق عرضٍ ما يزال حيّاً: خمسة فنّيين تُحرق في
     * دقيقة، وأربعة منهم يرون طلباً لا يستطيعون قبوله.
     */
    if (plan.nextRoundAt) await this.clearNextRound(orderId);

    const attemptsInRound = await this.offers.countAttemptsInRound(orderId, plan.round);
    if (attemptsInRound >= this.maxAttemptsPerRound) {
      await this.scheduleNextRound(order, plan.round);
      return;
    }

    const excluded = await this.offers.findExcludedProviderIds(orderId, plan.round);
    const candidate = await this.findNextCandidate(order, excluded);

    if (!candidate) {
      await this.scheduleNextRound(order, plan.round);
      return;
    }

    // الإسناد يسبق العرض: تحقّق الملكية في `orders` كلّه يقرأ `order.provider`،
    // فالعرض على فنّي غير مُسنَد كان ينتج قبولاً يُرفض بـ 403.
    await this.orderModel
      .findByIdAndUpdate(orderId, { $set: { provider: new Types.ObjectId(candidate.providerId) } })
      .exec();

    const refreshed = await this.orders.findById(orderId);
    const target = refreshed ?? order;
    // نافذة الحجز تُمرَّر هنا أيضاً لا في مسار التأكيد وحده: البديل الذي نبحث
    // عنه الآن يستحقّ ما استحقّه المُسنَد الأول — و٤٥ ثانية على موعدٍ بعد ساعة
    // تُقرأ خطأً وتُحرق مرشّحاً بلا داعٍ.
    await this.openOffer(
      target,
      candidate,
      attemptsInRound + 1,
      plan.round,
      this.bookingWindowSeconds(target),
    );
  }

  /**
   * تُنادى من المهمّة الدورية حين يحين موعد الجولة التالية.
   * عامّة عمداً: هي المدخل الوحيد لاستئناف بحثٍ نائم.
   */
  async resumeSearch(orderId: string): Promise<void> {
    await this.redispatch(orderId);
  }

  /**
   * الحجوزات المجدولة التي اقترب موعدها وتنتظر فعلاً — تأكيداً أو بديلاً.
   *
   * `metadata.booking.confirmationRequestedAt` هو ما يمنع تكرار الطلب كل
   * دقيقة: بدونه كانت المهمّة الدورية ستقصف الفنّي بإشعار في كل دورة.
   *
   * ولا يُشترط وجود فنّي مُسنَد. اشتراطه (`provider: { $ne: null }`) كان يُقصي
   * الحجز الذي اعتذر عنه صاحبه **بالضبط**: `releaseBooking` يحذف الحقل،
   * والحقل المحذوف لا يطابق `$ne: null` في MongoDB. فالحجز الذي وُعد بأن تجد
   * له الدورةُ التالية بديلاً لم تكن الدورة تراه أصلاً — يبقى `pending` بلا
   * فنّي، والعميل يراه مؤكّداً، ولا يُلغى إلا بشبكة الأمان بعد ساعتين من
   * **انقضاء الموعد نفسه**.
   *
   * `hasProvider` هو ما يفرّق المسارين عند المنادي: المُسنَد يُطلب تأكيده،
   * واليتيم يُبحث له عن بديل.
   */
  async findBookingsAwaitingConfirmation(
    leadMinutes: number,
    limit: number,
  ): Promise<Array<{ orderId: string; minutesUntil: number; hasProvider: boolean }>> {
    const now = Date.now();
    const docs = await this.orderModel
      .find({
        status: OrderStatus.PENDING,
        isScheduled: true,
        scheduledAt: { $gt: new Date(now), $lte: new Date(now + leadMinutes * 60_000) },
        'metadata.booking.confirmationRequestedAt': { $exists: false },
      })
      .select('_id scheduledAt provider')
      .limit(limit)
      .lean()
      .exec();

    return docs.map((doc: any) => ({
      orderId: doc._id.toString(),
      minutesUntil: Math.max(1, Math.round((new Date(doc.scheduledAt).getTime() - now) / 60_000)),
      hasProvider: !!doc.provider,
    }));
  }

  /** الطلبات التي حان موعد جولتها التالية */
  async findOrdersDueForNextRound(limit: number): Promise<string[]> {
    const docs = await this.orderModel
      .find({
        status: OrderStatus.PENDING,
        'metadata.dispatch.nextRoundAt': { $lte: new Date() },
      })
      .select('_id')
      .limit(limit)
      .lean()
      .exec();
    return docs.map((doc: any) => doc._id.toString());
  }

  // ===========================================
  // خطّة البحث — تُخزَّن على الطلب نفسه
  // ===========================================

  private readPlan(order: OrderEntity): { startedAt: Date; round: number; nextRoundAt: Date | null } {
    const raw = (order.metadata as any)?.dispatch;
    const startedAt = raw?.startedAt ? new Date(raw.startedAt) : new Date();
    const nextRoundAt = raw?.nextRoundAt ? new Date(raw.nextRoundAt) : null;
    return {
      startedAt: Number.isNaN(startedAt.getTime()) ? new Date() : startedAt,
      round: Number(raw?.round) > 0 ? Number(raw.round) : 1,
      // تاريخ فاسد يُقرأ عدماً لا NaN: الأخير يجعل كل مقارنة معه كاذبة بصمت
      nextRoundAt: nextRoundAt && !Number.isNaN(nextRoundAt.getTime()) ? nextRoundAt : null,
    };
  }

  /**
   * محو موعد الجولة المعلّق — يُنادى فور استئنافها.
   *
   * `$unset` لا `$set: null`: كلاهما يخرج من استعلام `findOrdersDueForNextRound`
   * (مقارنات المدى في MongoDB محصورة بنوع المعامل، فـ`$lte: <Date>` لا يطابق
   * `null` أصلاً)، لكن الحذف يقول «لا جولة مجدولة» بدل ترك حقل فارغ يُقرأ
   * كقيمة. وهو ما يفعله `abandon` و`scheduleNextRound` مع `provider`.
   */
  private async clearNextRound(orderId: string): Promise<void> {
    await this.orderModel
      .findByIdAndUpdate(orderId, { $unset: { 'metadata.dispatch.nextRoundAt': '' } })
      .exec();
  }

  /**
   * الكتابة بترقيم النقطة لا باستبدال `metadata` كاملاً: الحقل يحمل
   * `serviceName` الذي تقرؤه طبقة العرض، واستبداله كان يمحوه بصمت.
   */
  private async writePlan(orderId: string, patch: Record<string, any>): Promise<void> {
    const set: Record<string, any> = {};
    for (const [key, value] of Object.entries(patch)) set[`metadata.dispatch.${key}`] = value;
    await this.orderModel.findByIdAndUpdate(orderId, { $set: set }).exec();
  }

  private async scheduleNextRound(order: OrderEntity, currentRound: number): Promise<void> {
    const nextRoundAt = new Date(Date.now() + this.roundIntervalMs);

    // الجولة التالية تتجاوز السقف: لا معنى لتأجيلها ثم إلغاء الطلب عندها.
    const plan = this.readPlan(order);
    if (nextRoundAt.getTime() > this.dispatchDeadlineMs(order, plan)) {
      await this.abandon(order, 'انقضى سقف البحث دون فنّي متاح');
      return;
    }

    // فكّ الإسناد بين الجولات: بقاؤه مُسنداً لفنّي انقضت مهلته كان يُظهر الطلب
    // في «طلباتي» عنده وهو ليس له.
    await this.orderModel.findByIdAndUpdate(order.id, { $unset: { provider: '' } }).exec();
    await this.writePlan(order.id, { round: currentRound + 1, nextRoundAt });

    this.logger.log(
      `Order ${order.orderNumber}: round ${currentRound} exhausted, round ${currentRound + 1} at ${nextRoundAt.toISOString()}`,
    );
  }

  private async openOffer(
    order: OrderEntity,
    candidate: Candidate,
    attempt: number,
    round: number,
    windowSeconds?: number,
  ): Promise<void> {
    const seconds = windowSeconds ?? this.offerWindowSeconds;
    const expiresAt = new Date(Date.now() + seconds * 1000);
    const provider = await this.providerModel.findById(candidate.providerId).lean().exec();

    const distanceMeters =
      candidate.distanceMeters ?? this.distanceMetersBetween(provider?.location?.coordinates, order.userLocation?.coordinates);

    // فهرس التفرّد على (طلب، فنّي، محاولة) هو الحارس الأخير ضدّ عرضين
    // متزامنين — مسح المهلة ورفضٌ يصلان معاً مثلاً. اصطدامه ليس عطلاً بل
    // دليلٌ على أن مساراً آخر سبقنا، فنتركه له بدل أن نرمي 500 في وجه فنّي
    // لم يفعل شيئاً.
    let offer: RequestOfferEntity;
    try {
      offer = await this.offers.create({
        orderId: order.id,
        providerId: candidate.providerId,
        orderNumber: order.orderNumber,
        attempt,
        round,
        expiresAt,
        distanceMeters: distanceMeters ?? undefined,
        etaMinutes: undefined,
      });
    } catch (error: any) {
      if (error?.code === 11000) {
        this.logger.warn(
          `Duplicate offer suppressed (order ${order.orderNumber}, provider ${candidate.providerId}, round ${round})`,
        );
        return;
      }
      throw error;
    }

    // عدّاد العروض المستلمة — يُقاس ولا يُعاقَب عليه (انظر `closeAndRedispatch`)
    await this.bumpProviderCounter(candidate.providerId, 'offersReceived');

    const payload = ProviderRequestMapper.toDetail(order, {
      providerCoordinates: provider?.location?.coordinates,
      offer,
    });

    this.events.emit(
      ProviderAppEvents.OFFER_CREATED,
      new OfferCreatedEvent(candidate.providerId, offer.id, order.id, payload),
    );

    // الإشعار المدفوع هو ما يوقظ التطبيق والهاتف مقفل — فشله لا يُبطل العرض،
    // فالبثّ اللحظي وصل أصلاً والمهلة تمضي على أي حال.
    try {
      // نصّ الحجز يختلف جذرياً عن نصّ الطلب الفوري: «لديك ١٥ ثانية للرد» فوق
      // موعدٍ محجوز يُقرأ كخطأ، والمطلوب هناك تأكيدٌ لا سباق.
      const content = order.isScheduled
        ? notificationContent.bookingConfirmationDue(order.orderNumber, order.scheduledAt)
        : notificationContent.newRequestOfferForProvider(payload.serviceName, seconds, payload.distanceKm);

      await this.notifications.createNotification({
        recipientId: candidate.providerId,
        recipientType: 'provider',
        ...content,
        type: NotificationType.ORDER_CREATED,
        // العرض موجَّه إلى **تطبيق الفنّي حصراً**: البثّ اللحظي أعلاه على
        // `/provider` هو ما يفتح الشاشة، وهذا الإشعار هو ما يوقظ الهاتف
        // المُقفَل. أمّا القناة العامّة فتصل إلى لوحة المزوّد أيضاً، ونافذةٌ
        // ثانية بمهلة على شاشة قد لا يكون أمامها أحد تُحرق دور الطلب.
        skipRealtime: true,
        data: {
          event: 'provider_app.new_request',
          orderId: order.id,
          orderNumber: order.orderNumber,
          offerId: offer.id,
          isScheduled: !!order.isScheduled,
          expiresAt: expiresAt.toISOString(),
        },
      });
    } catch (error: any) {
      this.logger.error(
        `Offer push failed (order ${order.orderNumber} → provider ${candidate.providerId}): ${error?.message ?? error}`,
      );
    }

    this.logger.log(
      `Offer #${attempt} for order ${order.orderNumber} → provider ${candidate.providerId} (${seconds}s)`,
    );
  }

  /**
   * انقضى سقف البحث. الطلب **يُلغى** لا يُترك معلّقاً.
   *
   * كان يبقى `pending` بلا مزوّد حتى تمرّ دورة الإلغاء التلقائي بعد ساعتين —
   * والعميل واقف على الطريق ينتظر فنّياً لن يأتي، بلا إشارة تقول له ابحث عن
   * بديل. الإلغاء الصريح أرحم من انتظار صامت، والإدارة تُبلَّغ لأن الفشل هنا
   * ليس عطلاً تقنياً بل **ثغرة تغطية** في منطقة وخدمة بعينهما.
   *
   * الإلغاء يمرّ بـ`CancelOrderUseCase` لا بكتابة مباشرة. الكتابة المباشرة كانت
   * تُغيّر الحالة وتتخطّى كل ما يلزمها: لا سجلّ حالات (فالإلغاء يختفي من
   * التدقيق تماماً — وهو أكثر ما يُسأل عنه)، ولا إبطال للكاش (فيبقى الطلب
   * `pending` في قراءة العميل)، ولا بثّ لحظي (فتنتظر الشاشة دورة استطلاع).
   */
  private async abandon(order: OrderEntity, reason: string): Promise<void> {
    /**
     * الحجز ليس طلباً فورياً سقط، ولا يُخاطَب بنصّه.
     *
     * «لم نجد فنّياً متاحاً قريباً **خلال مدة البحث**» جملةٌ كُتبت لعميل واقف
     * على الطريق منذ عشر دقائق؛ وصولها إلى من حجز قبل ثلاثة أيام يُقرأ عبثاً.
     * والرمز ينفصل كذلك: خلط فشلِ تأكيد حجز بفجوة تغطية فورية يُفسد تقرير
     * التغطية الذي بُني الرمز لأجله.
     */
    const isBooking = !!order.isScheduled;

    /**
     * ما يخصّ التوزيع وحده يُكتب هنا، والإلغاء نفسه يُترك لصاحبه.
     *
     * وترتيبه **قبل** الإلغاء لا بعده: `CancelOrderUseCase` يقرأ الطلب في أوّله
     * ويبني الحدث من تلك القراءة، ففكّ الإسناد قبله يعني أن الحدث يخرج بلا
     * مزوّد — فلا يصل إشعار «طلبك أُلغي» إلى فنّي لم يقبل الطلب قط وربما انقضت
     * مهلته قبل دقائق.
     */
    await this.orderModel
      .findByIdAndUpdate(order.id, {
        $set: {
          /**
           * رمز ثابت لا نصّ عربي: هذا الإلغاء **ليس** إلغاء عميل ولا إلغاء
           * فنّي — هو فجوة تغطية، ودمجه معهما في تقرير واحد يُظهر ارتفاعاً في
           * «نسبة الإلغاء» يُقرأ كخلل في الخدمة بينما هو خلل في التغطية.
           * الترشيح على الرمز يصمد أمام تعديل نصّ الرسالة وترجمتها.
           */
          'metadata.cancellation.code': isBooking ? 'booking_unconfirmed' : 'no_provider_available',
          'metadata.cancellation.searchMinutes': Math.round(
            (Date.now() - this.readPlan(order).startedAt.getTime()) / 60_000,
          ),
        },
        $unset: { provider: '' },
      })
      .exec();

    await this.cancelOrder.execute(
      order.id,
      {
        reason: isBooking
          ? 'لم يؤكّد أي فنّي هذا الحجز قبل موعده'
          : 'لم نجد فنّياً متاحاً قريباً خلال مدة البحث',
        cancelledBy: 'system',
      },
      { _id: 'system', role: 'system' },
      // لنا إشعارنا الخاص أدناه — وهو يشرح السبب بدل أن يقول «أصبح: ملغى»
      { suppressStatusNotice: true },
    );

    this.logger.warn(`Dispatch abandoned for order ${order.orderNumber}: ${reason}`);

    try {
      await this.notifications.createNotification({
        recipientId: order.userId,
        recipientType: 'user',
        ...(isBooking
          ? notificationContent.bookingCouldNotBeStaffed(order.orderNumber, order.scheduledAt)
          : notificationContent.noProviderAvailableForOrder(order.orderNumber)),
        type: NotificationType.ALERT,
        data: {
          event: isBooking ? 'booking.unconfirmed' : 'order.no_provider',
          orderId: order.id,
          orderNumber: order.orderNumber,
        },
      });
    } catch (error: any) {
      this.logger.error(`No-provider notification failed for order ${order.orderNumber}: ${error?.message ?? error}`);
    }

    await this.alertAdminsOfCoverageGap(order);
  }

  /**
   * تنبيه الإدارة عند الفشل النهائي فقط — لا مع كل جولة، وإلا صار ضجيجاً
   * يُتجاهَل فيضيع معه التنبيه الذي يهمّ.
   */
  private async alertAdminsOfCoverageGap(order: OrderEntity): Promise<void> {
    try {
      const admin = await this.connection.collection('admins').findOne({ isActive: { $ne: false } });
      if (!admin) return;

      const [longitude, latitude] = order.userLocation?.coordinates ?? [];
      await this.notifications.createNotification({
        recipientId: admin._id.toString(),
        recipientType: 'admin',
        ...notificationContent.coverageGapForAdmin(
          order.orderNumber,
          order.serviceName,
          (order as any).address,
        ),
        type: NotificationType.ALERT,
        data: {
          event: 'dispatch.coverage_gap',
          orderId: order.id,
          orderNumber: order.orderNumber,
          serviceId: order.serviceId,
          latitude,
          longitude,
        },
      });
    } catch (error: any) {
      this.logger.error(`Coverage-gap alert failed for order ${order.orderNumber}: ${error?.message ?? error}`);
    }
  }

  /** عدّادات القبول — تُقاس للمراجعة، ولا تؤثّر آلياً على الإسناد */
  private async bumpProviderCounter(providerId: string, field: string): Promise<void> {
    try {
      await this.providerModel.findByIdAndUpdate(providerId, { $inc: { [field]: 1 } }).exec();
    } catch (error: any) {
      this.logger.debug(`Counter ${field} failed for provider ${providerId}: ${error?.message ?? error}`);
    }
  }

  // ===========================================
  // CANDIDATE SELECTION
  // ===========================================

  /**
   * أقرب فنّي **متّصل** لم يُجرَّب بعد، بتوسيع النطاق تدريجياً.
   *
   * المتّصلون وحدهم عن قصد. «غير متّصل» هنا ليست حالة شبكة بل قرار صريح
   * اتّخذه الفنّي: لا ترسلوا لي عملاً — وتجاوزه خطأ مبدئي. وعملياً: العرض على
   * فنّي أغلق تطبيقه ينتهي بانقضاء المهلة شبه حتماً، أي **نافذة كاملة من عمر
   * العميل تُحرق** لكل واحد منهم وهو واقف على الطريق. وحين لا يوجد متّصل فتلك
   * معلومة حقيقية تستحق أن تُقال للعميل وللإدارة، لا أن تُغطّى بمحاولات وهمية.
   */
  private async findNextCandidate(order: OrderEntity, excludedIds: string[]): Promise<Candidate | null> {
    const coordinates = order.userLocation?.coordinates;
    if (!coordinates || coordinates.length !== 2) return null;

    /**
     * أربعة أنواع من الاستبعاد:
     *
     * ١ · `excludedIds` — من رفض هذا الطلب، ومن جُرّب في هذه الجولة.
     * ٢ · `busy` — من بين يديه طلب قيد التنفيذ.
     * ٣ · `holding` — **من يقرّر الآن في عرض آخر**. الفنّي أثناء نافذته موردٌ
     *     محجوز: عرض ثانٍ يستبدل الأول على شاشته ويُعيد العدّاد، فيُحرم من
     *     إكمال قراره، ويبقى الطلب الأول معروضاً عليه في الخادم حتى تنقضي
     *     مهلته كاملةً — وعميلُه ينتظر نافذةً لم يرها أحد.
     * ٤ · `declined` — من اعتذر عن هذا الحجز. لا يغنينا عنه النوع الأول:
     *     الاعتذار يقع قبل الموعد بأيام حين لا عرض مفتوح، فلا يبقى منه سجلٌّ
     *     بحالة `rejected` ليراه `findExcludedProviderIds`.
     */
    const [busy, holding] = await Promise.all([
      this.findBusyProviderIds(),
      this.offers.findProviderIdsWithOpenOffers(),
    ]);
    const declined = ((order.metadata as any)?.booking?.declinedProviders ?? []) as string[];

    const excluded = [...new Set([...excludedIds, ...busy, ...holding, ...declined])]
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    for (const radiusMeters of this.radiiMeters) {
      const candidate = await this.queryCandidates(
        order,
        excluded,
        { status: ProviderStatus.ONLINE },
        radiusMeters,
      );
      if (candidate) return candidate;
    }

    return null;
  }

  private async queryCandidates(
    order: OrderEntity,
    excluded: Types.ObjectId[],
    statusFilter: Record<string, any>,
    radiusMeters: number,
  ): Promise<Candidate | null> {
    const [longitude, latitude] = order.userLocation.coordinates;
    const serviceId = order.serviceId;
    const query: Record<string, any> = {
      isApproved: true,
      isActive: { $ne: false },
      ...statusFilter,
    };
    if (excluded.length) query._id = { $nin: excluded };
    if (Types.ObjectId.isValid(serviceId)) {
      query.services = new Types.ObjectId(serviceId);
      query.$or = [
        { [`serviceAvailability.${serviceId}`]: { $exists: false } },
        { [`serviceAvailability.${serviceId}`]: { $ne: false } },
      ];
    }

    const [candidate] = await this.providerModel
      .aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [longitude, latitude] as [number, number] },
            distanceField: 'distanceMeters',
            maxDistance: radiusMeters,
            spherical: true,
            query,
          },
        },
        { $limit: 1 },
        { $project: { _id: 1, distanceMeters: 1 } },
      ])
      .exec();

    if (!candidate) return null;
    return { providerId: candidate._id.toString(), distanceMeters: candidate.distanceMeters };
  }

  /**
   * فنّي منشغل بطلب قيد التنفيذ لا يُعرض عليه طلب ثانٍ.
   *
   * المعيار هو `ENGAGING` لا `ACTIVE`: الفنّي الذي أنهى خدمته وينتظر تأكيد
   * العميل فارغ اليدين فعلاً، واستبعاده هنا كان يناقض `respond.accept` الذي
   * يسمح له بالقبول — فيصير مؤهّلاً للقبول ولا يصله عرض ليقبله.
   */
  private async findBusyProviderIds(): Promise<string[]> {
    // الاستعلام نفسه الذي يستعمله `create-order` لاختيار مرشّحه الأول — نسخة
    // واحدة في المستودع بدل نسختين تفترقان بصمت.
    return this.orders.findProviderIdsWithActiveOrders(ENGAGING_ORDER_STATUSES);
  }

  private distanceMetersBetween(from?: number[], to?: number[]): number | null {
    if (from?.length !== 2 || to?.length !== 2) return null;
    if (![...from, ...to].every((n) => Number.isFinite(n))) return null;
    const km = calculateDistance(
      { type: 'Point', coordinates: [from[0], from[1]] },
      { type: 'Point', coordinates: [to[0], to[1]] },
    );
    return Math.round(km * 1000);
  }
}
