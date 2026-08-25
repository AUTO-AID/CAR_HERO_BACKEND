/**
 * اختبار حيّ: من نموذج الموقع التعريفي حتى ما تقرأه لوحة المزوّد.
 *
 * **يمسك ما لا تمسكه اختبارات الوحدة.** العطل الذي كشفه أوّل تشغيل كان يقع
 * في أنبوب التحقّق قبل أن تصل البيانات إلى حالة الاستخدام: `services_list`
 * تتحوّل إلى `[[],[],[],[]]` فتُحفظ وثيقة المزوّد بلا خدمة واحدة، والطلب
 * يعود «ناجحاً». اختبار وحدة للأنبوب لا يعيد إنتاجه — جُرّب وفشل في ذلك —
 * فالطريق الوحيد الموثوق هو تشغيل الخادم فعلاً وقراءة ما استقرّ في القاعدة.
 *
 * يعمل على القاعدة المحلّية (MongoMemoryServer على mongodb-data-8):
 *   npm run dev:local                                 # طرفية أولى
 *   npm run e2e:provider-registration                 # طرفية ثانية
 */
const { MongoClient, ObjectId } = require('mongodb');

const API = 'http://localhost:3001/api/v1';
const MONGO = 'mongodb://127.0.0.1:27017/car_hero';
const PHONE = '+963955' + String(Date.now()).slice(-6);
const PASSWORD = 'Test@12345';

let failures = 0;
const step = (n, m) => console.log(`\n[${n}] ${m}`);
const ok = (m) => console.log(`   ✓ ${m}`);
const bad = (m) => { console.log(`   ✗ ${m}`); failures += 1; };

const call = async (method, path, body, token) => {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json };
};
const unwrap = (r) => r.body?.data ?? r.body;

(async () => {
  const mongo = await MongoClient.connect(MONGO);
  const db = mongo.db();
  console.log('phone:', PHONE);

  try {
    // ── 1) إنشاء حساب الدخول ──────────────────────────────────────────
    step(1, 'إنشاء حساب مزوّد + تأكيد OTP');
    let r = await call('POST', '/auth/register', {
      fullName: 'مالك ورشة الاختبار', phoneNumber: PHONE, password: PASSWORD,
      accountType: 'provider', isTermsAccepted: true,
    });
    if (r.status >= 400) return bad(`register ${r.status}: ${JSON.stringify(r.body).slice(0,300)}`);

    const pending = await db.collection('pending_registrations').findOne({ phoneNumber: PHONE });
    if (!pending?.otpCode) return bad('لم يُنشأ تحدّي OTP');
    r = await call('POST', '/auth/verify-otp', { phoneNumber: PHONE, otpCode: pending.otpCode });
    if (r.status >= 400) return bad(`verify-otp ${r.status}: ${JSON.stringify(r.body).slice(0,300)}`);
    ok('الحساب أُنشئ ووُثّق');

    // ── 2) تقديم الطلب بالشكل الذي يرسله الموقع بالضبط ────────────────
    step(2, 'POST /providers/apply بتخصّصات نصّية (كما يرسلها StepHours)');
    const declaredPrices = { oil: 45000, brakes: 90000, towing: 120000, battery: 30000 };
    r = await call('POST', '/providers/apply', {
      phone: PHONE,
      businessName: 'ورشة البطل للاختبار',
      ownerName: 'مالك ورشة الاختبار',
      description: 'ورشة اختبار آلية',
      category: 'mechanical',
      address: 'شارع بغداد',
      city: 'دمشق',
      governorate: 'دمشق',
      coverageAreas: ['المزة', 'كفرسوسة', 'داريا'],
      longitude: 36.2765, latitude: 33.5138,
      serviceCategories: ['maintenance', 'towing', 'battery'],
      services_list: [
        { service_id: 'oil', name: 'غيار زيت وفلاتر', price: declaredPrices.oil, currency: 'SYP_NEW', unit: 'خدمة' },
        { service_id: 'brakes', name: 'فرامل وديسك', price: declaredPrices.brakes, currency: 'SYP_NEW', unit: 'خدمة' },
        { service_id: 'towing', name: 'سطحة / إنقاذ', price: declaredPrices.towing, currency: 'SYP_NEW', unit: 'خدمة' },
        { service_id: 'battery', name: 'بطاريات', price: declaredPrices.battery, currency: 'SYP_NEW', unit: 'خدمة' },
      ],
      is_emergency: true,
      facilities: ['wifi', 'waiting'],
      techCount: 4,
      experienceYears: 12,
      shopPhotos: [{ name: 'front.jpg', size: 204800, type: 'image/jpeg' }],
      workingHours: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
        .map((day) => ({ day, open: '09:00', close: '19:00', isClosed: day === 'Friday' })),
    });
    if (r.status >= 400) return bad(`apply ${r.status}: ${JSON.stringify(r.body).slice(0,400)}`);
    ok('الطلب قُبل');

    // ── 3) قرار الإدارة: الموافقة والتفعيل ────────────────────────────
    step(3, 'محاكاة موافقة الإدارة (isApproved + isActive)');
    const provDoc = await db.collection('providers').findOne({ phone: PHONE });
    if (!provDoc) return bad('لم تُنشأ وثيقة المزوّد');
    await db.collection('providers').updateOne({ _id: provDoc._id },
      { $set: { isApproved: true, isActive: true, registrationStatus: 'approved', accountStatus: 'active' } });
    await db.collection('users').updateOne({ phoneNumber: PHONE }, { $set: { isActive: true, isVerified: true } });
    ok('اعتُمد المزوّد');

    // ── 4) ما تقرأه اللوحة ────────────────────────────────────────────
    step(4, 'تسجيل الدخول وقراءة GET /providers/me (نفس نداء اللوحة)');
    r = await call('POST', '/auth/login', { phoneNumber: PHONE, password: PASSWORD });
    if (r.status >= 400) return bad(`login ${r.status}: ${JSON.stringify(r.body).slice(0,300)}`);
    const token = unwrap(r)?.accessToken;
    if (!token) return bad('لا رمز دخول');

    r = await call('GET', '/providers/me', null, token);
    if (r.status >= 400) return bad(`providers/me ${r.status}: ${JSON.stringify(r.body).slice(0,300)}`);
    const me = unwrap(r);

    // ── 5) التحقّقات ──────────────────────────────────────────────────
    step(5, 'التحقّق حقلاً بحقل');
    const isOid = (v) => ObjectId.isValid(String(v));

    const services = me.services || [];
    services.length ? ok(`services: ${services.length} خدمة`) : bad('services فارغة — اللوحة ستُظهر صفحة خدمات خالية');
    services.every(isOid) ? ok('كلّها معرّفات كتالوج صالحة') : bad(`ليست معرّفات كتالوج: ${services.join(',')}`);

    const prices = me.servicePrices || {};
    const priceValues = Object.values(prices);
    Object.keys(prices).every(isOid) ? ok('servicePrices مفتاحها معرّف كتالوج') : bad(`مفاتيح الأسعار خاطئة: ${Object.keys(prices).join(',')}`);
    const declared = Object.values(declaredPrices);
    priceValues.some((p) => declared.includes(p))
      ? ok(`الأسعار المعلنة وصلت: ${priceValues.join(', ')}`)
      : bad(`لا سعر من أسعار التسجيل: ${priceValues.join(', ')}`);

    const cats = me.serviceCategories || [];
    const catalog = await db.collection('services')
      .find({ _id: { $in: services.map((s) => new ObjectId(String(s))) } }).toArray();
    const catNames = catalog.map((s) => `${s.category}:${s.nameAr || s.name}`);
    new Set(catNames).size === catNames.length ? ok('لا خدمات مكرّرة') : bad(`مكرّرة: ${catNames.join(' | ')}`);
    console.log('     الخدمات المُسندة:', catNames.join(' | '));
    console.log('     الفئات:', cats.join(', '));

    // حقول التسجيل الأخرى
    const checks = [
      ['businessName', me.businessName, 'ورشة البطل للاختبار'],
      ['city', me.city, 'دمشق'],
      ['governorate', me.governorate, 'دمشق'],
      ['techCount', me.techCount, 4],
      ['experienceYears', me.experienceYears, 12],
    ];
    for (const [name, actual, expected] of checks) {
      actual === expected ? ok(`${name} = ${actual}`) : bad(`${name}: توقّعنا ${expected} ووصل ${JSON.stringify(actual)}`);
    }
    JSON.stringify(me.coverageAreas) === JSON.stringify(['المزة','كفرسوسة','داريا'])
      ? ok(`coverageAreas = ${me.coverageAreas.join('، ')}`) : bad(`coverageAreas: ${JSON.stringify(me.coverageAreas)}`);
    (me.workingHours || []).length === 7 ? ok('workingHours: ٧ أيام') : bad(`workingHours: ${(me.workingHours||[]).length}`);
    const coords = me.location?.coordinates || [];
    (coords[0] === 36.2765 && coords[1] === 33.5138) ? ok(`location = [${coords.join(', ')}]`) : bad(`location: ${JSON.stringify(coords)}`);
    (me.shopPhotos || []).length ? ok(`shopPhotos: ${me.shopPhotos.length}`) : bad('shopPhotos فارغة');

    // ── 6) تعديل من اللوحة ────────────────────────────────────────────
    step(6, 'تعديل حقول التسجيل من اللوحة (PUT /providers/me)');
    r = await call('PUT', '/providers/me', {
      businessName: 'ورشة البطل — معدّلة',
      coverageAreas: ['المزة', 'قدسيا'],
      governorate: 'ريف دمشق',
      techCount: 6,
      experienceYears: 15,
    }, token);
    if (r.status >= 400) return bad(`PUT /providers/me ${r.status}: ${JSON.stringify(r.body).slice(0,400)}`);
    const after = unwrap(await call('GET', '/providers/me', null, token));
    after.techCount === 6 && after.governorate === 'ريف دمشق'
      && JSON.stringify(after.coverageAreas) === JSON.stringify(['المزة','قدسيا'])
      ? ok('التعديل حُفظ وقُرئ')
      : bad(`التعديل لم يُحفظ: ${JSON.stringify({g: after.governorate, t: after.techCount, c: after.coverageAreas})}`);
  } finally {
    await mongo.close();
    console.log(failures === 0 ? '\n=== النتيجة: كل التحقّقات نجحت ===' : `\n=== النتيجة: ${failures} فشل ===`);
    process.exitCode = failures ? 1 : 0;
  }
})();
