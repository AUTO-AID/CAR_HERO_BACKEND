// ============================================================
//  فحص ما قبل التصوير — يُشغَّل قبل كل محاولة، ولا نبدأ إن سقط شيء
//
//  الغرض واحد: ألّا نكتشف أمام اللجنة أن القائمة فارغة أو أن المزوّد المقصود
//  ليس أوّلها. ما يفحصه هنا هو **نفس ما يفحصه الخادم** لحظة الطلب.
//
//  الاستعمال:
//    node scripts/demo/preflight-demo.cjs [--service towing] [--lng ..] [--lat ..]
//
//  الافتراضي: نقطة الطلب على بُعد ~٢٧٠م شمال شرق الورشة، وخدمة «خدمة السحب»
//  (مزوّد العرض يقدّم السحب والبطارية والوقود — لا تغيير الإطار).
// ============================================================
const {
  connect,
  demoProvider,
  DEMO_PROVIDER_LOCATION,
  ENGAGING_ORDER_STATUSES,
  log,
} = require('./_shared.cjs');

const API = process.env.API_BASE || 'http://localhost:3001/api/v1';

/** نقطة العميل الافتراضية — قريبة بما يضمن أن الورشة الأقرب، بعيدة بما يُظهر حركة */
const DEFAULT_CUSTOMER = [
  DEMO_PROVIDER_LOCATION[0] + 0.0022, // ~٢٠٠م شرقاً
  DEMO_PROVIDER_LOCATION[1] + 0.0016, // ~١٨٠م شمالاً
];

const PER_KM = Number(process.env.ROAD_FEE_PER_KM || 150);
const ROUNDING = Number(process.env.ROAD_FEE_ROUNDING_STEP || 50);

function arg(name, fallback) {
  const index = process.argv.indexOf('--' + name);
  return index > -1 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const ok = (message) => log('  ✔ ' + message);
const warn = (message) => log('  ⚠ ' + message);
const bad = (message) => {
  log('  ✖ ' + message);
  process.exitCode = 1;
};

(async () => {
  const category = arg('service', 'towing');
  const longitude = Number(arg('lng', DEFAULT_CUSTOMER[0]));
  const latitude = Number(arg('lat', DEFAULT_CUSTOMER[1]));

  const { client, db } = await connect();
  try {
    log('══ فحص ما قبل التصوير ══');

    // ── ١) الخادم يعمل ────────────────────────────────────────
    log('\n١) الخادم');
    let serverUp = false;
    try {
      const response = await fetch(API + '/services');
      serverUp = response.ok;
      if (serverUp) ok('يستجيب على ' + API);
      else bad('ردّ بحالة ' + response.status);
    } catch {
      bad('لا يستجيب على ' + API + ' — شغّل npm run start:dev');
    }

    // ── ٢) الخدمة المطلوبة ────────────────────────────────────
    log('\n٢) الخدمة');
    const service = await db.collection('services').findOne({ category, isActive: true });
    if (!service) {
      bad('لا خدمة فعّالة بالفئة «' + category + '»');
      return;
    }
    const serviceId = service._id.toString();
    const catalogPrice = service.discountedPrice || service.basePrice;
    ok('«' + (service.nameAr || service.name) + '» — سعر الكتالوج ' + catalogPrice + ' ل.س');
    if (['oil', 'car_wash'].includes(category)) {
      warn('هذه الفئة تتطلّب اشتراك Premium على حساب العميل — اختر غيرها للعرض');
    }

    // ── ٣) مزوّد العرض ────────────────────────────────────────
    const demo = await demoProvider(db);
    log('\n٣) مزوّد العرض — ' + demo.businessName);

    if (demo.isApproved) ok('معتمَد');
    else bad('غير معتمَد — لن يظهر ولن يصله عرض');

    if (demo.isActive !== false) ok('مفعّل');
    else bad('معطّل');

    const coordinates = demo.location?.coordinates || [];
    const atWorkshop =
      Math.abs((coordinates[0] ?? 0) - DEMO_PROVIDER_LOCATION[0]) < 1e-6 &&
      Math.abs((coordinates[1] ?? 0) - DEMO_PROVIDER_LOCATION[1]) < 1e-6;
    if (atWorkshop) ok('الموقع: ' + demo.city + ' — ' + demo.address);
    else bad('الموقع انزاح عن عين اللوزة ([' + coordinates.join(', ') + ']) — شغّل reset-demo-provider.cjs');

    const offersService = (demo.services || []).some((id) => id.toString() === serviceId);
    if (offersService) ok('يقدّم هذه الخدمة بسعره المعلن ' + (demo.servicePrices || {})[serviceId] + ' ل.س');
    else bad('لا يقدّم «' + (service.nameAr || service.name) + '» — خدماته: ' + (demo.serviceCategories || []).join('، '));

    const busy = await db.collection('orders').countDocuments({
      provider: demo._id,
      status: { $in: ENGAGING_ORDER_STATUSES },
    });
    if (busy === 0) ok('لا طلب نشِط يحجبه');
    else bad(busy + ' طلب نشِط يجعله «مشغولاً» — شغّل reset-demo-provider.cjs');

    if (demo.status === 'offline') ok('مطفأ — جاهز ليضغط الزرّ أمام اللجنة');
    else warn('متّصل بالفعل: الزرّ مضغوط سلفاً، أطفئه إن كنت تريد تصوير لحظة التفعيل');

    // ── ٤) الترتيب كما سيكون لحظة الطلب ───────────────────────
    //
    // يُحسب من القاعدة لا من الـAPI عمداً: مزوّد العرض مطفأ الآن (وهذا هو
    // المطلوب — يشغّله بيده أمام اللجنة)، فلا يُرجعه `/providers/nearby`
    // إطلاقاً. والسؤال قبل التصوير هو «هل سيكون الأول **بعد** أن يضغط الزرّ؟»
    // — ونجيبه بتكرار فلاتر الخادم نفسها مع معاملته كمتّصل.
    log('\n٤) الترتيب عند نقطة الطلب [' + longitude.toFixed(5) + '، ' + latitude.toFixed(5) + ']');

    const busyIds = (
      await db.collection('orders').distinct('provider', {
        status: { $in: ENGAGING_ORDER_STATUSES },
        provider: { $ne: null },
      })
    ).filter(Boolean);

    const ranked = await db
      .collection('providers')
      .aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [longitude, latitude] },
            distanceField: 'distanceMeters',
            maxDistance: 20000,
            spherical: true,
            query: {
              isApproved: true,
              isActive: { $ne: false },
              services: service._id,
              _id: { $nin: busyIds },
              $and: [
                { $or: [{ status: 'online' }, { _id: demo._id }] },
                {
                  $or: [
                    { ['serviceAvailability.' + serviceId]: { $exists: false } },
                    { ['serviceAvailability.' + serviceId]: { $ne: false } },
                  ],
                },
              ],
            },
          },
        },
        { $limit: 3 },
        { $project: { businessName: 1, phone: 1, distanceMeters: 1, servicePrices: 1 } },
      ])
      .toArray();

    if (!ranked.length) {
      bad('لا مزوّد يقدّم هذه الخدمة قرب نقطة الطلب — ستكون القائمة فارغة');
      return;
    }

    /** نفس صيغة `OrderPricingService`: سعر المزوّد المعلن (وإلا الكتالوج) + أجرة الطريق */
    const priceOf = (provider, distanceKm) => {
      const declared = Number((provider.servicePrices || {})[serviceId]) || 0;
      const base = declared > 0 ? declared : catalogPrice;
      const fee = Math.round((distanceKm * PER_KM) / ROUNDING) * ROUNDING;
      return { base, fee, total: base + fee };
    };

    for (const [index, provider] of ranked.entries()) {
      const km = Math.round((provider.distanceMeters / 1000) * 100) / 100;
      const { total } = priceOf(provider, km);
      const mark = provider.phone === demo.phone ? '  ◀ مزوّد العرض' : '';
      log('  ' + (index + 1) + '. ' + provider.businessName + '  ·  ' + km + ' كم  ·  ' + total + ' ل.س' + mark);
    }

    if (ranked[0].phone === demo.phone) ok('سيكون الأول في القائمة بمجرّد أن يضغط زرّ التفعيل');
    else bad('الأول سيكون «' + ranked[0].businessName + '» لا مزوّد العرض — قرّب نقطة الطلب من الورشة');

    // ── ٥) تكامل السعر عبر الـAPI الحيّ ───────────────────────
    //
    // الخطوة ٤ تقلّد الخادم؛ هذه تسأل الخادم نفسه. تُقارَن على أي مزوّد
    // يُرجعه — المهم أن الصيغة المطبَّقة فعلياً هي «سعر المزوّد + أجرة الطريق».
    log('\n٥) تكامل السعر — سعر المزوّد المعلن + أجرة الطريق');
    if (!serverUp) {
      warn('تُخطّى — الخادم لا يستجيب');
    } else {
      const url =
        API + '/providers/nearby?longitude=' + longitude + '&latitude=' + latitude +
        '&serviceId=' + serviceId + '&limit=3&maxDistanceKm=20';
      const payload = await fetch(url).then((response) => response.json());
      const live = Array.isArray(payload) ? payload : payload?.data || [];

      if (!live.length) {
        warn('لا نتائج حيّة الآن — لا متّصل قريباً يقدّم هذه الخدمة');
      } else {
        let mismatches = 0;
        for (const provider of live) {
          const { base, fee, total } = priceOf(provider, provider.distance);
          const line =
            '  ' + provider.businessName + ': ' + base + ' + ' + fee +
            ' (طريق ' + provider.distance + ' كم) = ' + total + '  ·  الخادم: ' + provider.price;
          if (provider.price === total) log(line);
          else {
            log(line + '  ✖');
            mismatches += 1;
          }
        }
        if (mismatches === 0) ok('كل سعر معروض = سعر صاحبه + أجرة الطريق — وهو نفسه ما يُقفَل على الطلب');
        else bad(mismatches + ' سعراً لا يطابق الصيغة');
      }
    }

    const demoRow = ranked.find((provider) => provider.phone === demo.phone);
    if (demoRow) {
      const km = Math.round((demoRow.distanceMeters / 1000) * 100) / 100;
      const { base, fee, total } = priceOf(demo, km);
      log('');
      log('  ما سيراه العميل لمزوّد العرض: ' + base + ' (سعره المعلن) + ' + fee + ' (طريق ' + km + ' كم) = ' + total + ' ل.س');
    }

    log('\n══ ' + (process.exitCode ? '✖ لا تبدأ التصوير — عالج ما سبق' : '✔ جاهز للتصوير') + ' ══');
  } finally {
    await client.close();
  }
})().catch((error) => {
  console.error('✖ فشل الفحص:', error.message);
  process.exit(1);
});
