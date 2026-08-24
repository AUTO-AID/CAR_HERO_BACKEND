import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus } from '../../../../core/enums/status.enum';
import { NotificationsService } from '../../../notifications/application/services/notifications.service';
import { CancelOrderUseCase } from '../../../orders/application/use-cases/cancel-order.use-case';
import { IOrderRepository } from '../../../orders/domain/repositories/order.repository.interface';
import { ENGAGING_ORDER_STATUSES } from '../../../orders/domain/services/order-state-machine';
import { Order } from '../../../orders/infrastructure/persistence/mongoose/schemas/order.schema';
import { Provider } from '../../../providers/infrastructure/persistence/mongoose/schemas/provider.schema';
import { OfferStatus, RequestOfferEntity } from '../../domain/entities/request-offer.entity';
import { IRequestOfferRepository } from '../../domain/repositories/request-offer.repository.interface';
import { ProviderDispatchService } from './provider-dispatch.service';

const ORDER_ID = '65f000000000000000000001';
const CANDIDATE_ID = '65f000000000000000000002';
const BUSY_HOLDER_ID = '65f000000000000000000003';

const CONFIG: Record<string, any> = {
  'providerApp.offerWindowSeconds': 45,
  'providerApp.maxDispatchAttempts': 5,
  'providerApp.dispatchRadiiKm': [10, 20, 30],
  'providerApp.roundIntervalSeconds': 60,
  'providerApp.searchDeadlineMinutes': 10,
  'providerApp.bookingDispatchFloorMinutes': 30,
};

/** عرض حيّ أو ميّت — الفارق هو ما يفصل «فنّي يقرّر الآن» عن «عرض لم يُمسح بعد» */
const offerEntity = (expiresInSeconds: number) =>
  new RequestOfferEntity(
    'offer-1',
    ORDER_ID,
    CANDIDATE_ID,
    'CH-1',
    OfferStatus.OFFERED,
    1,
    2,
    new Date(Date.now() - 5_000),
    new Date(Date.now() + expiresInSeconds * 1000),
  );

describe('ProviderDispatchService — استئناف الجولة', () => {
  let service: ProviderDispatchService;
  let offers: any;
  let orders: any;
  let orderModel: any;
  let providerModel: any;
  let cancelOrder: any;
  let notifications: any;
  let cache: any;

  /** الخطّة كما تُقرأ من الطلب: جولة ثانية حان موعدها قبل ثوانٍ */
  const pendingOrder = (dispatch: Record<string, any> = {}) => ({
    id: ORDER_ID,
    orderNumber: 'CH-1',
    userId: 'user-1',
    serviceId: '65f000000000000000000009',
    status: OrderStatus.PENDING,
    isScheduled: false,
    total: 1000,
    userLocation: { type: 'Point', coordinates: [36.3, 33.5] },
    metadata: {
      dispatch: {
        startedAt: new Date(Date.now() - 90_000),
        round: 2,
        nextRoundAt: new Date(Date.now() - 5_000),
        ...dispatch,
      },
    },
  });

  /**
   * حجز مجدول — موعده بعد `minutesUntil`، وخطّة بحثه بدأت قبل نصف ساعة.
   *
   * البدء قبل نصف ساعة مقصود: يتجاوز سقف الطلب الفوري (عشر دقائق) بفارق كبير،
   * فأي اختبار يمرّ هنا يُثبت أن المسطرة صارت الموعدَ لا لحظةَ البدء.
   */
  const bookingOrder = (minutesUntil: number, booking: Record<string, any> = {}) => ({
    ...pendingOrder({ startedAt: new Date(Date.now() - 30 * 60_000), round: 1, nextRoundAt: null }),
    isScheduled: true,
    scheduledAt: new Date(Date.now() + minutesUntil * 60_000),
    metadata: {
      dispatch: { startedAt: new Date(Date.now() - 30 * 60_000), round: 1, nextRoundAt: null },
      booking,
    },
  });

  beforeEach(async () => {
    offers = {
      findOpenForOrder: jest.fn().mockResolvedValue([]),
      findOpenForOrderAndProvider: jest.fn().mockResolvedValue(null),
      findOpenForProvider: jest.fn().mockResolvedValue(null),
      findProviderIdsWithOpenOffers: jest.fn().mockResolvedValue([]),
      countAttemptsInRound: jest.fn().mockResolvedValue(0),
      findExcludedProviderIds: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue(offerEntity(45)),
      closeIfOpen: jest.fn(),
      closeAllOpenForOrder: jest.fn(),
    };

    orders = {
      findById: jest.fn().mockResolvedValue(pendingOrder()),
      findProviderIdsWithActiveOrders: jest.fn().mockResolvedValue([]),
    };

    orderModel = {
      findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      distinct: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
      find: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      }),
    };

    providerModel = {
      // `findById` يُنادى بسلسلتين مختلفتين: `.select().lean().exec()` عند فحص
      // الاتصال، و`.lean().exec()` عند فتح العرض.
      findById: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({
          _id: CANDIDATE_ID,
          location: { type: 'Point', coordinates: [36.31, 33.51] },
        }),
      }),
      findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      aggregate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ _id: CANDIDATE_ID, distanceMeters: 2400 }]),
      }),
    };

    cancelOrder = { execute: jest.fn().mockResolvedValue(null) };
    notifications = { createNotification: jest.fn().mockResolvedValue(null) };
    cache = { del: jest.fn().mockResolvedValue(undefined), get: jest.fn(), set: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProviderDispatchService,
        { provide: IRequestOfferRepository, useValue: offers },
        { provide: IOrderRepository, useValue: orders },
        { provide: getModelToken(Order.name), useValue: orderModel },
        { provide: getModelToken(Provider.name), useValue: providerModel },
        { provide: NotificationsService, useValue: notifications },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        { provide: ConfigService, useValue: { get: (key: string) => CONFIG[key] } },
        { provide: CancelOrderUseCase, useValue: cancelOrder },
        { provide: CACHE_MANAGER, useValue: cache },
        {
          provide: getConnectionToken(),
          useValue: { collection: () => ({ findOne: jest.fn().mockResolvedValue(null) }) },
        },
      ],
    }).compile();

    service = module.get(ProviderDispatchService);
  });

  /** ما كتبه الاختبار على `metadata.dispatch` — مجمّعاً من كل نداءات التحديث */
  const dispatchWrites = () =>
    orderModel.findByIdAndUpdate.mock.calls.map(([, update]: [string, any]) => update);

  it('لا يفتح عرضاً ثانياً بينما عرضٌ حيّ ما يزال مفتوحاً على الطلب', async () => {
    offers.findOpenForOrder.mockResolvedValue([offerEntity(30)]);

    await service.resumeSearch(ORDER_ID);

    // هذا هو العطل بعينه: كانت المهمّة الدورية تلتقط الطلب كل خمس عشرة ثانية
    // فتفتح عرضاً جديداً وتُعيد إسناد الطلب، فيُرفض قبول صاحب العرض الأول
    // بـ409 وعدّاده ما يزال يدور.
    expect(offers.create).not.toHaveBeenCalled();
    expect(dispatchWrites().some((update: any) => update?.$set?.provider)).toBe(false);
  });

  it('لا يحجبه عرضٌ انقضت مهلته ولم يمرّ عليه المسح بعد', async () => {
    offers.findOpenForOrder.mockResolvedValue([offerEntity(-10)]);

    await service.resumeSearch(ORDER_ID);

    // وإلا لتجمّد البحث إلى الأبد خلف عرضٍ ميّت
    expect(offers.create).toHaveBeenCalledTimes(1);
  });

  it('يمحو موعد الجولة فور استئنافها فلا تلتقطه المهمّة الدورية ثانيةً', async () => {
    await service.resumeSearch(ORDER_ID);

    expect(dispatchWrites()).toContainEqual(
      expect.objectContaining({ $unset: { 'metadata.dispatch.nextRoundAt': '' } }),
    );
    expect(offers.create).toHaveBeenCalledTimes(1);
  });

  it('لا يكتب محواً حين لا يكون هناك موعد معلّق أصلاً', async () => {
    orders.findById.mockResolvedValue(pendingOrder({ nextRoundAt: null }));

    await service.resumeSearch(ORDER_ID);

    expect(dispatchWrites().some((update: any) => update?.$unset)).toBe(false);
  });

  it('يتجاهل الطلب الذي لم يعد معلّقاً', async () => {
    orders.findById.mockResolvedValue({ ...pendingOrder(), status: OrderStatus.ACCEPTED });

    await service.resumeSearch(ORDER_ID);

    expect(offers.create).not.toHaveBeenCalled();
    expect(offers.findOpenForOrder).not.toHaveBeenCalled();
  });

  it('يستبعد المنشغلين بطلب قيد التنفيذ من الترشيح', async () => {
    orders.findProviderIdsWithActiveOrders.mockResolvedValue([BUSY_HOLDER_ID]);

    await service.resumeSearch(ORDER_ID);

    const [pipeline] = providerModel.aggregate.mock.calls[0];
    expect(pipeline[0].$geoNear.query._id.$nin.map(String)).toContain(BUSY_HOLDER_ID);
  });

  it('يقرأ المنشغلين من المستودع بمعيار ENGAGING لا بنسخة محلّية', async () => {
    await service.resumeSearch(ORDER_ID);

    // نسختان من الاستعلام هما ما تفترقان بصمت — وهو أصل البند ٥
    expect(orders.findProviderIdsWithActiveOrders).toHaveBeenCalledWith(ENGAGING_ORDER_STATUSES);
  });

  describe('الفنّي المشغول بعرض آخر', () => {
    const HOLDER_ID = '65f000000000000000000031';

    it('يُستبعد من الترشيح', async () => {
      offers.findProviderIdsWithOpenOffers.mockResolvedValue([HOLDER_ID]);

      await service.resumeSearch(ORDER_ID);

      // عرضٌ ثانٍ يستبدل الأول على شاشته ويُعيد العدّاد — ويبقى الطلب الأول
      // معروضاً عليه في الخادم حتى تنقضي مهلته كاملةً
      const [pipeline] = providerModel.aggregate.mock.calls[0];
      expect(pipeline[0].$geoNear.query._id.$nin.map(String)).toContain(HOLDER_ID);
    });

    it('لا يصله طلب جديد عبر المسار السريع', async () => {
      orders.findById.mockResolvedValue({ ...pendingOrder(), providerId: CANDIDATE_ID });
      providerModel.findById.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ _id: CANDIDATE_ID, status: 'online' }),
      });
      offers.findOpenForProvider.mockResolvedValue(offerEntity(30));

      await service.dispatchNewOrder(ORDER_ID);

      // المسار السريع يتخطّى `findNextCandidate` بكل استبعاداته — فلولا هذا
      // الفحص لدخل الطلب من بابه الخلفي إلى فنّي يحمل عرضاً حيّاً
      expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
        ORDER_ID,
        expect.objectContaining({ $unset: { provider: '' } }),
      );
    });

    it('يصله الطلب عبر المسار السريع حين تكون يداه فارغتين', async () => {
      orders.findById.mockResolvedValue({ ...pendingOrder(), providerId: CANDIDATE_ID });
      providerModel.findById.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ _id: CANDIDATE_ID, status: 'online' }),
      });

      await service.dispatchNewOrder(ORDER_ID);

      expect(offers.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('كاش الطلب', () => {
    it('يُبطل الكاش عند اعتذار الفنّي عن حجز', async () => {
      await service.releaseBooking(ORDER_ID, CANDIDATE_ID, 'ظرف طارئ');

      // بدونه يرى العميل اسم من اعتذر حتى تنتهي مدّة الكاش — وشاشة الحجز لا
      // تستطلع دورياً فلا شيء يصحّحها قبل ذلك.
      expect(cache.del).toHaveBeenCalledWith(`order_${ORDER_ID}`);
    });

    /**
     * الإسناد أثناء البحث **لا** يستدعي إبطالاً، والاختبار يثبّت ذلك عمداً:
     * تطبيق الفنّي يقرأ من المستودع مباشرةً لا من المسار المخزَّن، وواجهة
     * العميل تُخفي الفنّي ما دام الطلب `pending`، والقبول يُبطل الكاش بنفسه.
     * إضافة إبطال هنا كلفةٌ بلا مقابل في أكثر المسارات تكراراً.
     */
    it('لا يُبطله مع كل إسناد أثناء البحث', async () => {
      await service.resumeSearch(ORDER_ID);

      expect(cache.del).not.toHaveBeenCalled();
    });
  });

  describe('انقضاء سقف البحث', () => {
    /** بحثٌ بدأ قبل إحدى عشرة دقيقة — تجاوز السقف (عشر دقائق) */
    beforeEach(() => {
      orders.findById.mockResolvedValue(
        pendingOrder({ startedAt: new Date(Date.now() - 11 * 60_000) }),
      );
    });

    it('يُلغي عبر CancelOrderUseCase لا بكتابة مباشرة', async () => {
      await service.resumeSearch(ORDER_ID);

      // الكتابة المباشرة كانت تتخطّى سجلّ الحالات وإبطال الكاش والبثّ اللحظي
      expect(cancelOrder.execute).toHaveBeenCalledTimes(1);
      const [orderId, dto, actor] = cancelOrder.execute.mock.calls[0];
      expect(orderId).toBe(ORDER_ID);
      expect(dto.cancelledBy).toBe('system');
      expect(actor.role).toBe('system');

      // ولا يُكتب `status` مباشرةً بعد اليوم
      expect(dispatchWrites().some((update: any) => update?.$set?.status)).toBe(false);
    });

    it('يكتم الإشعار العامّ فلا يصل العميل إشعاران عن حادثة واحدة', async () => {
      await service.resumeSearch(ORDER_ID);

      const [, , , options] = cancelOrder.execute.mock.calls[0];
      expect(options).toEqual(expect.objectContaining({ suppressStatusNotice: true }));

      // ويبقى إشعاره الخاص — وهو الذي يشرح السبب
      const recipients = notifications.createNotification.mock.calls.map(([dto]: [any]) => dto.recipientType);
      expect(recipients.filter((type: string) => type === 'user')).toHaveLength(1);
    });

    it('يفكّ الإسناد قبل الإلغاء لا بعده', async () => {
      await service.resumeSearch(ORDER_ID);

      // وإلا حمل الحدثُ مزوّداً فوصل إشعار «طلبك أُلغي» إلى فنّي لم يقبله قط
      const unsetCallIndex = orderModel.findByIdAndUpdate.mock.invocationCallOrder[
        dispatchWrites().findIndex((update: any) => update?.$unset?.provider === '')
      ];
      const cancelCallIndex = cancelOrder.execute.mock.invocationCallOrder[0];
      expect(unsetCallIndex).toBeLessThan(cancelCallIndex);
    });

    it('يحفظ رمز فجوة التغطية للتقارير', async () => {
      await service.resumeSearch(ORDER_ID);

      const write = dispatchWrites().find((update: any) => update?.$set?.['metadata.cancellation.code']);
      expect(write.$set['metadata.cancellation.code']).toBe('no_provider_available');
      expect(write.$set['metadata.cancellation.searchMinutes']).toBe(11);
    });

    it('لا يفتح عرضاً بعد انقضاء السقف', async () => {
      await service.resumeSearch(ORDER_ID);

      expect(offers.create).not.toHaveBeenCalled();
    });
  });

  /**
   * الحجز المجدول — مسطرته الموعد لا لحظة بدء البحث.
   *
   * كان يُقاس بسقف الطلب الفوري، ونافذة تأكيده (ثلث ما تبقّى ≈ نصف ساعة)
   * تتجاوز العشر دقائق حتماً — فكل حجز لم يؤكَّد كان يُلغى وأمامه ساعة كاملة.
   */
  describe('سقف الحجز المجدول', () => {
    it('يواصل البحث عن بديل رغم تجاوز سقف الطلب الفوري', async () => {
      orders.findById.mockResolvedValue(bookingOrder(60));

      await service.resumeSearch(ORDER_ID);

      // ثلاثون دقيقة مضت على البحث — ضعف سقف الفوري ثلاث مرّات — والموعد ما
      // زال بعد ساعة، فلا معنى للاستسلام
      expect(offers.create).toHaveBeenCalledTimes(1);
      expect(cancelOrder.execute).not.toHaveBeenCalled();
    });

    it('يُلغيه صراحةً حين يقترب الموعد أكثر من الحدّ الأدنى', async () => {
      orders.findById.mockResolvedValue(bookingOrder(20));

      await service.resumeSearch(ORDER_ID);

      // عشرون دقيقة قبل الموعد: لا فنّي سيصل، والإلغاء الصريح الآن أرحم من
      // صمتٍ يكتشفه العميل عند الموعد
      expect(cancelOrder.execute).toHaveBeenCalledTimes(1);
      expect(offers.create).not.toHaveBeenCalled();
    });

    it('يفصل رمز الإلغاء عن فجوة التغطية الفورية', async () => {
      orders.findById.mockResolvedValue(bookingOrder(20));

      await service.resumeSearch(ORDER_ID);

      // خلطهما يُظهر فشل تأكيد حجز كثغرة تغطية في تقرير المناطق
      const write = dispatchWrites().find((update: any) => update?.$set?.['metadata.cancellation.code']);
      expect(write.$set['metadata.cancellation.code']).toBe('booking_unconfirmed');
    });

    it('يمنح عرض الحجز نافذة تليق بموعده لا نافذة الطلب الفوري', async () => {
      orders.findById.mockResolvedValue(bookingOrder(60));

      await service.resumeSearch(ORDER_ID);

      const [{ expiresAt }] = offers.create.mock.calls[0];
      const windowSeconds = Math.round((expiresAt.getTime() - Date.now()) / 1000);
      // ثلث ما تبقّى (عشرون دقيقة) لا خمس وأربعون ثانية: الفنّي لم يكن ينتظر
      // إشعاراً، والمطلوب منه تأكيدٌ لا سباق
      expect(windowSeconds).toBeGreaterThan(600);
    });
  });

  describe('الفنّي المعتذِر عن حجز', () => {
    const DECLINER_ID = '65f000000000000000000041';

    it('يُراكم المعتذرين في قائمة لا يستبدل آخرهم أوّلهم', async () => {
      await service.releaseBooking(ORDER_ID, DECLINER_ID, 'ظرف طارئ');

      // بـ`$set` كان ثاني معتذِر يمحو الأول فيعود مرشّحاً لحجزٍ رفضه بنفسه
      expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
        ORDER_ID,
        expect.objectContaining({
          $addToSet: { 'metadata.booking.declinedProviders': DECLINER_ID },
        }),
      );
    });

    it('يُستبعد من البحث عن بديل', async () => {
      orders.findById.mockResolvedValue(bookingOrder(60, { declinedProviders: [DECLINER_ID] }));

      await service.resumeSearch(ORDER_ID);

      // الاستبعاد المعتاد لا يراه: الاعتذار يقع قبل الموعد بأيام حين لا عرض
      // مفتوح، فلا يبقى منه سجلّ عرض بحالة `rejected`
      const [pipeline] = providerModel.aggregate.mock.calls[0];
      expect(pipeline[0].$geoNear.query._id.$nin.map(String)).toContain(DECLINER_ID);
    });
  });

  describe('التقاط الحجوزات المنتظرة', () => {
    it('لا يشترط وجود فنّي مُسنَد', async () => {
      const chain = orderModel.find();
      chain.exec.mockResolvedValue([
        { _id: { toString: () => ORDER_ID }, scheduledAt: new Date(Date.now() + 60 * 60_000) },
      ]);

      const due = await service.findBookingsAwaitingConfirmation(90, 25);

      // `provider: { $ne: null }` كان يُقصي الحجز اليتيم بالضبط: الحقل محذوف،
      // والمحذوف لا يطابق `$ne: null` — فالحجز الذي اعتذر عنه فنّيه لم تكن
      // الدورة تراه أصلاً، ويبقى معلّقاً حتى يمضي موعده
      const [query] = orderModel.find.mock.calls.at(-1);
      expect(query).not.toHaveProperty('provider');
      expect(due[0].hasProvider).toBe(false);
    });

    it('يُميّز المُسنَد ليُطلب تأكيده', async () => {
      const chain = orderModel.find();
      chain.exec.mockResolvedValue([
        {
          _id: { toString: () => ORDER_ID },
          scheduledAt: new Date(Date.now() + 60 * 60_000),
          provider: CANDIDATE_ID,
        },
      ]);

      const due = await service.findBookingsAwaitingConfirmation(90, 25);

      expect(due[0].hasProvider).toBe(true);
    });
  });
});
