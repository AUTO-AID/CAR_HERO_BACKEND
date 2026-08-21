/**
 * دورة حياة الطلب من زاوية تطبيق الفنّي — من العرض إلى الإتمام.
 *
 * لماذا اختبار تكامل لا وحدة: القيمة كلّها في **الوصلات** — أن يقلع رسم
 * الاعتماديات، وأن يُنشئ إنشاءُ الطلب عرضاً، وأن يمرّ القبول عبر آلة الحالات
 * نفسها التي تستعملها الإدارة، وأن تُغلق الأفعال الميدانية الطلب على الحالة
 * الصحيحة. لا شيء من ذلك يظهر في `tsc` ولا في اختبار وحدة بمُحاكيات.
 *
 * قاعدة بيانات في الذاكرة لا مُحاكيات: الاستعلامات الجغرافية (`$geoNear`)
 * وفهارس التفرّد جزء من المنطق المُختبَر هنا، ومُحاكاة المستودع كانت ستُخفي
 * أكثر ما قد ينكسر.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { Connection, Types } from 'mongoose';
// استيراد افتراضي لا `* as`: المشروع على `module: nodenext` مع
// `esModuleInterop`، فـ`import * as request` يُنتج كائن فضاء أسماء لا دالة.
import request from 'supertest';

import { PasswordUtil } from '../src/core/utils';
import { OrderStatus, ProviderStatus } from '../src/core/enums/status.enum';

/**
 * متغيّرات البيئة تُضبط قبل استيراد `AppModule`: `mongoConfig` تقرأها عند
 * تركيب الوحدة، والاستيراد الديناميكي داخل `beforeAll` كان يتطلّب
 * `--experimental-vm-modules`. الضبط هنا يسبق أي استيراد لأن `import` يُرفع.
 */
process.env.ALLOW_LOCAL_DB = 'true';
process.env.DISABLE_WHATSAPP = 'true';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
// المفاتيح **مسطّحة** لا `jwt.expiresIn`: هكذا يقرأها `TokenUtil` فعلاً
// (`configService.get('JWT_EXPIRES_IN')`)، والقيم الافتراضية في
// `env.config.ts` تحت `jwt.*` لا يقرأها أحد. غيابها هنا كان يجعل الدخول 500.
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.NODE_ENV = 'test';

import { AppModule } from '../src/app.module';
import { OrdersCronService } from '../src/modules/orders/infrastructure/services/orders-cron.service';

jest.setTimeout(180_000);

const PASSWORD = 'Provider123';
const PROVIDER_PHONE = '+963991000001';
const CUSTOMER_PHONE = '+963991000002';

// دمشق — أي نقطة ثابتة تكفي، لكن الفنّي والطلب يجب أن يتجاورا كي يجدهما
// `$geoNear` ضمن نطاق معقول.
const PROVIDER_COORDS = [36.2765, 33.5138];
const ORDER_COORDS = [36.2795, 33.5165];

describe('Provider App — دورة حياة الطلب (e2e)', () => {
  let mongo: MongoMemoryReplSet;
  let app: INestApplication;
  let db: Connection;

  let providerToken: string;
  let customerToken: string;
  let providerId: string;
  let serviceId: string;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  /** الردود مغلّفة بـ TransformInterceptor عالمياً */
  const unwrap = (res: any) => res.body?.data ?? res.body;

  beforeAll(async () => {
    // نسخة طبق الأصل (replica set) لا خادماً مفرداً: الكود يستعمل عمليات
    // ذرّية على العروض، وبعضها يحتاج بيئة تدعم المعاملات.
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });

    process.env.MONGODB_URI = mongo.getUri('carhero_test');

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.setGlobalPrefix('api/v1');
    await app.init();

    db = app.get<Connection>(getConnectionToken());
    await seed();
  });

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  async function seed() {
    const hashed = await PasswordUtil.hash(PASSWORD);

    const service = await db.collection('services').insertOne({
      name: 'Tire Change',
      nameAr: 'تغيير إطار',
      category: 'tire',
      basePrice: 45,
      estimatedDuration: 30,
      isActive: true,
      createdAt: new Date(),
    });
    serviceId = service.insertedId.toString();

    const provider = await db.collection('providers').insertOne({
      phone: PROVIDER_PHONE,
      businessName: 'ورشة النخبة',
      ownerName: 'سامر خالد',
      location: { type: 'Point', coordinates: PROVIDER_COORDS },
      services: [service.insertedId],
      serviceAvailability: {},
      servicePrices: {},
      status: ProviderStatus.OFFLINE,
      isApproved: true,
      isActive: true,
      accountStatus: 'active',
      registrationStatus: 'approved',
      averageRating: 0,
      totalOrders: 0,
      createdAt: new Date(),
    });
    providerId = provider.insertedId.toString();

    // الفهرس الجغرافي يُنشأ عادةً من المخطّط عند الإقلاع، لكن المجموعة أُنشئت
    // هنا يدوياً — بدونه يفشل `$geoNear` في التوزيع.
    await db.collection('providers').createIndex({ location: '2dsphere' });

    await db.collection('users').insertMany([
      {
        fullName: 'سامر خالد',
        phoneNumber: PROVIDER_PHONE,
        password: hashed,
        accountType: 'provider',
        isVerified: true,
        isActive: true,
        createdAt: new Date(),
      },
      {
        fullName: 'أحمد الرواشدة',
        phoneNumber: CUSTOMER_PHONE,
        password: hashed,
        accountType: 'customer',
        isVerified: true,
        isActive: true,
        createdAt: new Date(),
      },
    ]);
  }

  async function login(phoneNumber: string) {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ phoneNumber, password: PASSWORD })
      .expect(200);
    return unwrap(res).accessToken as string;
  }

  it('١ — يقلع رسم الاعتماديات ويسجّل الدخول للطرفين', async () => {
    providerToken = await login(PROVIDER_PHONE);
    customerToken = await login(CUSTOMER_PHONE);
    expect(providerToken).toBeTruthy();
    expect(customerToken).toBeTruthy();
  });

  it('٢ — الرئيسية تبدأ بلا طلب نشِط وبلا اتصال', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/provider-app/home')
      .set(auth(providerToken))
      .expect(200);

    const home = unwrap(res);
    expect(home.online).toBe(false);
    expect(home.activeRequest).toBeNull();
    expect(home.incomingRequest).toBeNull();
    expect(home.offerWindowSeconds).toBeGreaterThan(0);
  });

  it('٣ — تشغيل الاتصال يحدّث الحالة والموقع معاً', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/provider-app/presence')
      .set(auth(providerToken))
      .send({ online: true, latitude: PROVIDER_COORDS[1], longitude: PROVIDER_COORDS[0] })
      .expect(200);

    expect(unwrap(res).online).toBe(true);

    const doc = await db.collection('providers').findOne({ _id: new Types.ObjectId(providerId) });
    expect(doc?.status).toBe(ProviderStatus.ONLINE);
    expect(doc?.location.coordinates).toEqual(PROVIDER_COORDS);
  });

  let orderId: string;

  it('٤ — طلب العميل يصل الفنّي كعرض بمهلة', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set(auth(customerToken))
      .send({ serviceId, location: { coordinates: ORDER_COORDS } })
      .expect(201);

    orderId = unwrap(created).id;
    expect(orderId).toBeTruthy();

    // التوزيع يقع على حدث `order.created` غير المتزامن
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const res = await request(app.getHttpServer())
      .get('/api/v1/provider-app/home')
      .set(auth(providerToken))
      .expect(200);

    const incoming = unwrap(res).incomingRequest;
    expect(incoming).toBeTruthy();
    expect(incoming.id).toBe(orderId);
    expect(incoming.status).toBe(OrderStatus.PENDING);
    // المسافة وزمن الوصول محسوبان لا منسوخان
    expect(incoming.distanceKm).toBeGreaterThan(0);
    expect(incoming.etaMinutes).toBeGreaterThanOrEqual(1);
    // العدّاد يبدأ ممّا تبقّى فعلاً من المهلة لا من رقم ثابت
    expect(incoming.offer.secondsRemaining).toBeGreaterThan(0);
    expect(incoming.offer.secondsRemaining).toBeLessThanOrEqual(incoming.offer.windowSeconds);
  });

  it('٥ — القبول ينقل الطلب إلى «مقبول» ويغلق العرض', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/provider-app/requests/${orderId}/accept`)
      .set(auth(providerToken))
      .expect(200);

    expect(unwrap(res).status).toBe(OrderStatus.ACCEPTED);

    const offer = await db.collection('requestoffers').findOne({ order: new Types.ObjectId(orderId) });
    expect(offer?.status).toBe('accepted');
  });

  it('٦ — القبول مرّتين مرفوض بـ409 لا بـ500', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/provider-app/requests/${orderId}/accept`)
      .set(auth(providerToken))
      .expect(409);
  });

  it('٧ — الأفعال الميدانية تتقدّم بالترتيب فقط', async () => {
    // قفزة غير مسموحة: «بدء الخدمة» قبل التوجّه أو الوصول
    await request(app.getHttpServer())
      .post(`/api/v1/provider-app/requests/${orderId}/complete`)
      .set(auth(providerToken))
      .send({})
      .expect(400);

    for (const [action, expected] of [
      ['en-route', OrderStatus.PROVIDER_EN_ROUTE],
      ['arrived', OrderStatus.PROVIDER_ARRIVED],
      ['start', OrderStatus.IN_PROGRESS],
    ] as const) {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/provider-app/requests/${orderId}/${action}`)
        .set(auth(providerToken))
        .expect(200);
      expect(unwrap(res).status).toBe(expected);
    }
  });

  it('٨ — نبضة الموقع تُحدِّث تتبّع الطلب وملف الفنّي', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/provider-app/location')
      .set(auth(providerToken))
      .send({ latitude: 33.5150, longitude: 36.2780, orderId })
      .expect(200);

    const order = await db.collection('orders').findOne({ _id: new Types.ObjectId(orderId) });
    expect(order?.providerLocation?.coordinates).toEqual([36.2780, 33.5150]);
    expect(order?.providerLocationUpdatedAt).toBeTruthy();
  });

  it('٩ — الإنهاء يُحيل إلى تأكيد العميل لا إلى «مكتمل»', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/provider-app/requests/${orderId}/complete`)
      .set(auth(providerToken))
      .send({ notes: 'تم تبديل الإطار' })
      .expect(200);

    expect(unwrap(res).status).toBe(OrderStatus.AWAITING_CUSTOMER_CONFIRMATION);

    const order = await db.collection('orders').findOne({ _id: new Types.ObjectId(orderId) });
    expect(order?.providerNotes).toBe('تم تبديل الإطار');
  });

  it('١٠ — انتظار تأكيد العميل لا يحبس الفنّي عن العمل', async () => {
    // الرئيسية تتحرّر: الطلب لم يعد «بين يديه»
    const home = unwrap(
      await request(app.getHttpServer())
        .get('/api/v1/provider-app/home')
        .set(auth(providerToken))
        .expect(200),
    );
    expect(home.activeRequest).toBeNull();

    // ويستطيع إيقاف الاتصال — كان ممنوعاً قبل فصل «مشغول» عن «غير منتهٍ»
    await request(app.getHttpServer())
      .post('/api/v1/provider-app/presence')
      .set(auth(providerToken))
      .send({ online: false })
      .expect(200);

    // لكنه يبقى ظاهراً في تبويب «نشطة» حتى يؤكّد العميل
    const active = unwrap(
      await request(app.getHttpServer())
        .get('/api/v1/provider-app/requests?scope=active')
        .set(auth(providerToken))
        .expect(200),
    );
    expect(active.requests.map((r: any) => r.id)).toContain(orderId);
  });

  it('١١ — تأكيد العميل يُغلق الطلب وينقله إلى «سابقة»', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/orders/${orderId}/customer-confirm-completion`)
      .set(auth(customerToken))
      .expect(201);

    const past = unwrap(
      await request(app.getHttpServer())
        .get('/api/v1/provider-app/requests?scope=past')
        .set(auth(providerToken))
        .expect(200),
    );
    const found = past.requests.find((r: any) => r.id === orderId);
    expect(found).toBeTruthy();
    expect(found.status).toBe(OrderStatus.COMPLETED);
  });

  it('١٢ — الفنّي لا يرى طلب غيره', async () => {
    const otherProvider = await db.collection('providers').insertOne({
      phone: '+963991000009',
      businessName: 'ورشة أخرى',
      location: { type: 'Point', coordinates: [36.30, 33.52] },
      services: [],
      isApproved: true,
      isActive: true,
      status: ProviderStatus.OFFLINE,
      createdAt: new Date(),
    });
    await db.collection('orders').updateOne(
      { _id: new Types.ObjectId(orderId) },
      { $set: { provider: otherProvider.insertedId } },
    );

    await request(app.getHttpServer())
      .get(`/api/v1/provider-app/requests/${orderId}`)
      .set(auth(providerToken))
      .expect(403);
  });

  it('١٣ — العميل لا يصل إلى سطح الفنّي إطلاقاً', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/provider-app/home')
      .set(auth(customerToken))
      .expect(403);
  });

  /**
   * انحدار: القبول بعد انقضاء المهلة كان يترك الطلب يتيماً.
   *
   * كان الإغلاق يشترط `status = offered` وحده، فيُغلق العرض المنتهي «مقبولاً»
   * ثم تفشل إعادة التوزيع بصمت لأن العرض لم يعد مفتوحاً — فيبقى الطلب
   * `pending` مُسنداً بلا عرض مفتوح: لا المسح الدوري يراه ولا أحد يوزّعه.
   * المطلوب: رفض القبول **وإعادة الطلب إلى التوزيع** في النداء نفسه.
   */
  it('١٤ — القبول بعد انقضاء المهلة يُرفض ولا يترك الطلب يتيماً', async () => {
    // فنّي ثانٍ قريب كي يوجد مرشّح لإعادة التوزيع — وأبعد قليلاً من الأول
    // حتى لا ينافسه على العرض الأوّل.
    const second = await db.collection('providers').insertOne({
      phone: '+963991000003',
      businessName: 'ورشة الشام',
      location: { type: 'Point', coordinates: [36.2860, 33.5210] },
      services: [new Types.ObjectId(serviceId)],
      serviceAvailability: {},
      servicePrices: {},
      status: ProviderStatus.ONLINE,
      isApproved: true,
      isActive: true,
      accountStatus: 'active',
      registrationStatus: 'approved',
      createdAt: new Date(),
    });

    await request(app.getHttpServer())
      .post('/api/v1/provider-app/presence')
      .set(auth(providerToken))
      .send({ online: true, latitude: PROVIDER_COORDS[1], longitude: PROVIDER_COORDS[0] })
      .expect(200);

    // الإسناد صريح لا بالأقرب: الاختبار يحتاج أن يقع العرض الأوّل على الفنّي
    // الذي سيقبل متأخّراً، وترك الاختيار للمسافة كان يمرّر الاختبار لسببٍ
    // آخر (409 لأن الطلب ليس له أصلاً) فيبدو ناجحاً وهو لا يفحص شيئاً.
    const created = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set(auth(customerToken))
      .send({ serviceId, providerId, location: { coordinates: ORDER_COORDS } })
      .expect(201);
    const staleOrderId = unwrap(created).id;

    await new Promise((resolve) => setTimeout(resolve, 1200));

    // نُقادم المهلة يدوياً بدل انتظار عشرين ثانية حقيقية — ونُبقي الحالة
    // `offered` كي نُحاكي بالضبط ما لم يمسحه المسح الدوري بعد.
    const staleOffer = await db.collection('requestoffers').findOneAndUpdate(
      { order: new Types.ObjectId(staleOrderId), status: 'offered' },
      { $set: { expiresAt: new Date(Date.now() - 1000) } },
    );
    expect(staleOffer).toBeTruthy();

    await request(app.getHttpServer())
      .post(`/api/v1/provider-app/requests/${staleOrderId}/accept`)
      .set(auth(providerToken))
      .expect(409);

    // العرض المنتهي أُغلق «منتهياً» لا «مقبولاً»
    const closed = await db
      .collection('requestoffers')
      .findOne({ order: new Types.ObjectId(staleOrderId), provider: new Types.ObjectId(providerId) });
    expect(closed?.status).toBe('expired');

    // والطلب انتقل إلى الفنّي التالي بدل أن يبقى معلّقاً
    await new Promise((resolve) => setTimeout(resolve, 800));
    const order = await db.collection('orders').findOne({ _id: new Types.ObjectId(staleOrderId) });
    expect(order?.status).toBe(OrderStatus.PENDING);
    expect(order?.provider?.toString()).toBe(second.insertedId.toString());

    const reoffered = await db
      .collection('requestoffers')
      .findOne({ order: new Types.ObjectId(staleOrderId), provider: second.insertedId });
    expect(reoffered?.status).toBe('offered');
  });

  /**
   * «غير متّصل» قرارٌ صريح من الفنّي لا حالة شبكة، وتجاوزه يحرق نافذة كاملة من
   * انتظار العميل على عرضٍ لن يُردّ عليه. وحين لا يوجد متّصل **لا يُلغى الطلب
   * فوراً**: تُجدول جولة تالية، لأن فنّياً قد يفتح تطبيقه بعد لحظات.
   */
  it('١٥ — لا يُعرض الطلب على غير المتّصلين، وتُجدول جولة تالية', async () => {
    await db.collection('providers').updateMany({}, { $set: { status: ProviderStatus.OFFLINE } });

    const created = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set(auth(customerToken))
      .send({ serviceId, location: { coordinates: ORDER_COORDS } })
      .expect(201);
    const lonelyOrderId = unwrap(created).id;

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const offers = await db
      .collection('requestoffers')
      .countDocuments({ order: new Types.ObjectId(lonelyOrderId) });
    expect(offers).toBe(0);

    const order = await db.collection('orders').findOne({ _id: new Types.ObjectId(lonelyOrderId) });
    expect(order?.status).toBe(OrderStatus.PENDING);
    expect(order?.provider ?? null).toBeNull();
    // جولة تالية مجدولة — لا استسلام ولا إلغاء
    expect(order?.metadata?.dispatch?.nextRoundAt).toBeTruthy();
  });

  /**
   * الحجز المجدول: يجب أن **يُرى** في التطبيق قبل موعده (كان يُسند بإشعار ثم
   * لا يجده الفنّي في أي شاشة)، وأن يكون الاعتذار عنه ممكناً مبكراً.
   */
  it('١٦ — الحجز المجدول يظهر كحجز قادم ويمكن الاعتذار عنه', async () => {
    const allDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(
      (day) => ({ day, open: '00:00', close: '23:59', isClosed: false }),
    );
    await db.collection('providers').updateOne(
      { _id: new Types.ObjectId(providerId) },
      { $set: { workingHours: allDay, status: ProviderStatus.ONLINE } },
    );

    const scheduleTime = new Date(Date.now() + 48 * 3_600_000);
    scheduleTime.setHours(11, 0, 0, 0);

    const created = await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .set(auth(customerToken))
      .send({
        serviceId,
        providerId,
        location: { coordinates: ORDER_COORDS },
        scheduleTime: scheduleTime.toISOString(),
      })
      .expect(201);
    const bookingId = unwrap(created).id;

    // يظهر في «نشطة» موسوماً كحجز قادم لا كعرض بمهلة
    const active = unwrap(
      await request(app.getHttpServer())
        .get('/api/v1/provider-app/requests?scope=active')
        .set(auth(providerToken))
        .expect(200),
    );
    const listed = active.requests.find((r: any) => r.id === bookingId);
    expect(listed).toBeTruthy();
    expect(listed.isUpcomingBooking).toBe(true);

    // ولا يُفتح عليه عرض بمهلة عدّاد ما دام الموعد بعيداً
    const offers = await db
      .collection('requestoffers')
      .countDocuments({ order: new Types.ObjectId(bookingId) });
    expect(offers).toBe(0);

    await request(app.getHttpServer())
      .post(`/api/v1/provider-app/requests/${bookingId}/decline-booking`)
      .set(auth(providerToken))
      .send({ reason: 'ارتباط آخر' })
      .expect(200);

    const after = await db.collection('orders').findOne({ _id: new Types.ObjectId(bookingId) });
    expect(after?.provider ?? null).toBeNull();
    expect(after?.metadata?.booking?.declineReason).toBe('ارتباط آخر');
  });

  /**
   * أرباح الفنّي لا تبقى رهينة صمت العميل. التأكيد التلقائي يمرّ من مسار
   * الإتمام نفسه، فيقع تحويل الأرباح وسجلّ الحالات مرّة واحدة في مكان واحد.
   */
  it('١٧ — التأكيد التلقائي يُغلق الطلب ويحرّر الأرباح بعد المهلة', async () => {
    await db.collection('providers').updateOne(
      { _id: new Types.ObjectId(providerId) },
      { $set: { status: ProviderStatus.ONLINE } },
    );

    const created = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set(auth(customerToken))
      .send({ serviceId, providerId, location: { coordinates: ORDER_COORDS } })
      .expect(201);
    const freshOrderId = unwrap(created).id;

    await new Promise((resolve) => setTimeout(resolve, 1200));

    for (const action of ['accept', 'en-route', 'arrived', 'start', 'complete']) {
      await request(app.getHttpServer())
        .post(`/api/v1/provider-app/requests/${freshOrderId}/${action}`)
        .set(auth(providerToken))
        .send({})
        .expect(200);
    }

    // نُقادم لحظة طلب التأكيد بدل انتظار أربع وعشرين ساعة حقيقية
    await db.collection('orders').updateOne(
      { _id: new Types.ObjectId(freshOrderId) },
      { $set: { completionRequestedAt: new Date(Date.now() - 25 * 3_600_000) } },
    );

    await app.get(OrdersCronService).handlePendingCustomerConfirmations();

    const order = await db.collection('orders').findOne({ _id: new Types.ObjectId(freshOrderId) });
    expect(order?.status).toBe(OrderStatus.COMPLETED);
    expect(order?.metadata?.autoConfirmedAt).toBeTruthy();
    // لم يؤكّد العميل بنفسه — والتمييز هو ما تحتاجه المحاسبة عند أي اعتراض
    expect(order?.customerConfirmedAt ?? null).toBeNull();

    const wallet = await db
      .collection('wallets')
      .findOne({ ownerId: new Types.ObjectId(providerId), ownerType: 'provider' });
    expect(wallet?.balance).toBeGreaterThan(0);
  });
});
