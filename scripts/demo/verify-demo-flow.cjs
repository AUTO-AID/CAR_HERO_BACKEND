// ============================================================
//  تشغيل السيناريو كاملاً عبر الـAPI الحيّ — قبل أن يُجرّب أمام اللجنة
//
//  يمرّ على الرحلة نفسها التي ستُصوَّر: تفعيل الاتصال ← قائمة العميل ←
//  إنشاء الطلب موجَّهاً ← وصول العرض ← القبول ← التوجّه ← نبضات الموقع ←
//  قراءة التتبّع. وفي كل خطوة يتحقّق من **السعر**: أن يبقى الرقم الذي رآه
//  العميل في القائمة هو نفسه على الطلب وبعد القبول.
//
//  يُنشئ عميلاً مؤقّتاً ومركبةً مؤقّتة، ويحذف كل ما أنشأه في النهاية —
//  ويعيد مزوّد العرض إلى حالته (مطفأ، في عين اللوزة) مهما انتهى.
//
//  الاستعمال:
//    node scripts/demo/verify-demo-flow.cjs --password "<كلمة مرور مزوّد العرض>"
// ============================================================
const bcrypt = require('bcrypt');
const {
  connect,
  demoProvider,
  DEMO_PROVIDER_LOCATION,
  DEMO_PROVIDER_PHONE,
  ObjectId,
  log,
} = require('./_shared.cjs');

const API = process.env.API_BASE || 'http://localhost:3001/api/v1';
const CUSTOMER_PHONE = '+963900111222';
const CUSTOMER_PASSWORD = 'Verify#2026';

/** نقطة العميل — نفس افتراضي `preflight-demo.cjs` */
const CUSTOMER_LOCATION = [
  DEMO_PROVIDER_LOCATION[0] + 0.0022,
  DEMO_PROVIDER_LOCATION[1] + 0.0016,
];

let failures = 0;
const ok = (message) => log('  ✔ ' + message);
const bad = (message) => {
  log('  ✖ ' + message);
  failures += 1;
};

function arg(name, fallback) {
  const index = process.argv.indexOf('--' + name);
  return index > -1 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

async function call(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = payload?.message ? JSON.stringify(payload.message) : response.statusText;
    throw new Error(method + ' ' + path + ' → ' + response.status + ' ' + detail);
  }
  return payload?.data !== undefined ? payload.data : payload;
}

(async () => {
  const providerPassword = arg('password');
  if (!providerPassword) {
    console.error('مطلوب: --password "<كلمة مرور مزوّد العرض ' + DEMO_PROVIDER_PHONE + '>"');
    process.exit(1);
  }

  const { client, db } = await connect();
  const created = { userId: null, vehicleId: null, orderId: null };

  try {
    const demo = await demoProvider(db);
    const service = await db.collection('services').findOne({ category: 'towing', isActive: true });
    const serviceId = service._id.toString();

    // ── عميل مؤقّت ─────────────────────────────────────────────
    log('══ تشغيل السيناريو عبر الـAPI ══\n');
    log('٠) تجهيز عميل مؤقّت');
    await db.collection('users').deleteMany({ phoneNumber: CUSTOMER_PHONE });
    const userInsert = await db.collection('users').insertOne({
      fullName: 'عميل تحقّق مؤقّت',
      phoneNumber: CUSTOMER_PHONE,
      password: await bcrypt.hash(CUSTOMER_PASSWORD, 10),
      accountType: 'customer',
      role: 'user',
      isVerified: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    created.userId = userInsert.insertedId;

    const vehicleInsert = await db.collection('vehicles').insertOne({
      owner: created.userId,
      brand: 'Kia',
      model: 'Rio',
      year: 2018,
      plateNumber: 'TEST-0001',
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    created.vehicleId = vehicleInsert.insertedId;
    ok('أُنشئ العميل ومركبته');

    // ── ١) المزوّد يشغّل الاتصال ───────────────────────────────
    log('\n١) المزوّد يضغط زرّ التفعيل');
    const providerSession = await call('/auth/login', {
      method: 'POST',
      body: { phoneNumber: DEMO_PROVIDER_PHONE, password: providerPassword },
    });
    const providerToken = providerSession.accessToken;
    const presence = await call('/provider-app/presence', {
      method: 'POST',
      token: providerToken,
      body: {
        online: true,
        longitude: DEMO_PROVIDER_LOCATION[0],
        latitude: DEMO_PROVIDER_LOCATION[1],
      },
    });
    presence.online ? ok('صار متّصلاً') : bad('لم يتحوّل إلى متّصل');

    const me = await call('/provider-app/me', { token: providerToken });
    me.location
      ? ok('موقع الورشة يصل للتطبيق: [' + me.location.longitude + '، ' + me.location.latitude + ']')
      : bad('الموقع لا يصل في /provider-app/me — نقطة انطلاق المحاكاة ستسقط للارتداد');

    // ── ٢) العميل يرى القائمة ──────────────────────────────────
    log('\n٢) قائمة المزوّدين عند العميل');
    const customerSession = await call('/auth/login', {
      method: 'POST',
      body: { phoneNumber: CUSTOMER_PHONE, password: CUSTOMER_PASSWORD },
    });
    const customerToken = customerSession.accessToken;

    const nearby = await call(
      '/providers/nearby?longitude=' + CUSTOMER_LOCATION[0] + '&latitude=' + CUSTOMER_LOCATION[1] +
      '&serviceId=' + serviceId + '&limit=3&maxDistanceKm=20',
    );
    const listed = nearby.find((provider) => provider.phone === DEMO_PROVIDER_PHONE);
    if (!listed) {
      bad('مزوّد العرض ليس في القائمة — أوقفتُ التحقّق');
      return;
    }
    ok('«' + listed.businessName + '» في المرتبة ' + (nearby.indexOf(listed) + 1) + ' · ' + listed.distance + ' كم · ' + listed.price + ' ل.س');

    const declared = Number((demo.servicePrices || {})[serviceId]);
    log('    سعره المعلن (فورم التسجيل / لوحته): ' + declared + ' ل.س');
    log('    أجرة الطريق المضافة: ' + (listed.price - declared) + ' ل.س');

    // ── ٣) الطلب يُنشأ بالسعر نفسه ─────────────────────────────
    log('\n٣) إنشاء الطلب موجَّهاً إلى هذا المزوّد');
    const order = await call('/orders', {
      method: 'POST',
      token: customerToken,
      body: {
        serviceId,
        vehicleId: created.vehicleId.toString(),
        location: { type: 'Point', coordinates: CUSTOMER_LOCATION },
        requestedProviderId: listed._id || listed.id,
        notes: 'تحقّق آلي — يُحذف بعد الفحص',
      },
    });
    created.orderId = order.id || order._id;
    ok('أُنشئ الطلب ' + order.orderNumber);

    const orderTotal = order.totalAmount ?? order.total;
    orderTotal === listed.price
      ? ok('سعر الطلب = السعر المعروض في القائمة (' + orderTotal + ' ل.س)')
      : bad('سعر الطلب ' + orderTotal + ' ≠ المعروض ' + listed.price);

    // ── ٤) العرض يصل والمزوّد يقبل ─────────────────────────────
    log('\n٤) وصول العرض والقبول');
    let incoming = null;
    for (let attempt = 0; attempt < 10 && !incoming; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const home = await call('/provider-app/home', { token: providerToken });
      if (home.incomingRequest?.id === created.orderId) incoming = home.incomingRequest;
    }
    incoming ? ok('العرض وصل إلى تطبيق المزوّد') : bad('لم يصل العرض خلال ٥ ثوانٍ');

    if (incoming) {
      await call('/provider-app/requests/' + created.orderId + '/accept', {
        method: 'POST',
        token: providerToken,
      });
      ok('قُبل الطلب');

      const afterAccept = await call('/orders/' + created.orderId, { token: customerToken });
      const acceptedTotal = afterAccept.totalAmount ?? afterAccept.total;
      acceptedTotal === listed.price
        ? ok('السعر بعد القبول ثابت (' + acceptedTotal + ' ل.س) — لا طريق محسوب مرّتين')
        : bad('السعر تغيّر بعد القبول: ' + acceptedTotal + ' بدل ' + listed.price);

      const breakdown = afterAccept.metadata?.pricing;
      breakdown
        ? ok('المكوّنات محفوظة: خدمة ' + breakdown.servicePrice + ' + طريق ' + breakdown.roadFee + ' (' + breakdown.distanceKm + ' كم)')
        : bad('metadata.pricing غير محفوظ');

      // ── ٥) التوجّه ونبضات الموقع ─────────────────────────────
      log('\n٥) التوجّه وتتبّع الموقع');
      await call('/provider-app/requests/' + created.orderId + '/en-route', {
        method: 'POST',
        token: providerToken,
      });
      ok('الحالة: في الطريق');

      // ثلاث نبضات على الخطّ بين الورشة والعميل — كما تفعل المحاكاة تماماً
      for (const fraction of [0.25, 0.5, 0.75]) {
        await call('/provider-app/location', {
          method: 'POST',
          token: providerToken,
          body: {
            longitude: DEMO_PROVIDER_LOCATION[0] + (CUSTOMER_LOCATION[0] - DEMO_PROVIDER_LOCATION[0]) * fraction,
            latitude: DEMO_PROVIDER_LOCATION[1] + (CUSTOMER_LOCATION[1] - DEMO_PROVIDER_LOCATION[1]) * fraction,
            orderId: created.orderId,
          },
        });
      }

      const tracking = await call('/orders/' + created.orderId + '/tracking', { token: customerToken });
      const coordinates = tracking?.providerLocation?.coordinates || tracking?.provider?.location?.coordinates;
      coordinates
        ? ok('العميل يقرأ موقع المزوّد: [' + coordinates.map((value) => value.toFixed(5)).join('، ') + ']')
        : bad('التتبّع لا يُرجع موقع المزوّد: ' + JSON.stringify(tracking).slice(0, 200));
    }
  } catch (error) {
    bad(error.message);
  } finally {
    // ── تنظيف ────────────────────────────────────────────────
    log('\n٦) تنظيف');
    if (created.orderId) {
      await db.collection('orders').deleteOne({ _id: new ObjectId(created.orderId) });
      await db.collection('requestoffers').deleteMany({ orderId: new ObjectId(created.orderId) });
      await db.collection('status_histories').deleteMany({ entityId: new ObjectId(created.orderId) });
    }
    if (created.vehicleId) await db.collection('vehicles').deleteOne({ _id: created.vehicleId });
    if (created.userId) {
      await db.collection('users').deleteOne({ _id: created.userId });
      await db.collection('notifications').deleteMany({ recipientId: created.userId });
    }
    await db.collection('providers').updateOne(
      { phone: DEMO_PROVIDER_PHONE },
      {
        $set: {
          location: { type: 'Point', coordinates: DEMO_PROVIDER_LOCATION },
          status: 'offline',
        },
      },
    );
    log('  ✔ حُذف ما أُنشئ، وأُعيد المزوّد إلى عين اللوزة مطفأً');
    await client.close();

    log('\n══ ' + (failures ? '✖ ' + failures + ' إخفاقاً' : '✔ السيناريو كامل وسليم') + ' ══');
    process.exit(failures ? 1 : 0);
  }
})();
