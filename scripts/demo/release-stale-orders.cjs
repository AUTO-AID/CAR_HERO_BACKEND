// ============================================================
//  تحرير المزوّدين المشغولين — إغلاق الطلبات العالقة من البذر
//
//  **المشكلة:** ٢١٥١ طلباً في القاعدة عالق في حالة نشطة (`in_progress`،
//  `accepted`، `provider_en_route`، `provider_arrived`) منذ أسابيع. وكل
//  استعلام ترشيح يستبعد صاحبها: `create-order` و`/providers/nearby` و
//  `ProviderDispatchService` ثلاثتها تحسب من له طلب في `ENGAGING_ORDER_STATUSES`
//  «مشغولاً» فلا يُعرض عليه شيء ولا يظهر في قائمة العميل. النتيجة: ١٢٤٦ من
//  ١٩١٠ مزوّداً محجوبون بطلبات لن ينهيها أحد.
//
//  **الإغلاق:**
//   · النشِط  ← `completed`  — عملٌ وقع فعلاً في تاريخ المنصّة، وإلغاؤه كان
//     سيضخّم عدّاد الإلغاء في لوحة الأدمن ويشوّه أرقام العرض.
//   · المعلّق ← `cancelled` — طلب لم يقبله أحد قطّ، و«إنجازه» كذبة في السجلّ.
//
//  الطلبات النشطة **الحديثة** (أقل من ٤٨ ساعة) لا تُلمس افتراضياً: قد تكون
//  محاولة تجريب جارية لا بقايا بذر. `--all` يتجاوز هذا الحدّ.
// ============================================================
const { connect, ENGAGING_ORDER_STATUSES, log } = require('./_shared.cjs');

const STALE_HOURS = 48;

(async () => {
  const takeAll = process.argv.includes('--all');
  const cutoff = new Date(Date.now() - STALE_HOURS * 3600 * 1000);
  const olderThan = takeAll ? {} : { createdAt: { $lt: cutoff } };

  const { client, db } = await connect();
  try {
    const orders = db.collection('orders');
    const now = new Date();

    const activeFilter = { status: { $in: ENGAGING_ORDER_STATUSES }, ...olderThan };
    const activeCount = await orders.countDocuments(activeFilter);
    const completed = await orders.updateMany(activeFilter, {
      $set: {
        status: 'completed',
        completedAt: now,
        // أثرٌ صريح في الوثيقة: من يقرأ الطلب بعد شهر يجب أن يعرف أن حالته
        // كُتبت بسكربت تجهيز لا بفعل فنّي.
        'metadata.demoClosure': { closedBy: 'release-stale-orders', at: now, from: 'engaging' },
      },
    });

    const pendingFilter = { status: 'pending', ...olderThan };
    const pendingCount = await orders.countDocuments(pendingFilter);
    const cancelled = await orders.updateMany(pendingFilter, {
      $set: {
        status: 'cancelled',
        cancelledAt: now,
        cancellationReason: 'إغلاق بيانات تجريبية قبل العرض التقديمي',
        'metadata.demoClosure': { closedBy: 'release-stale-orders', at: now, from: 'pending' },
      },
    });

    // العروض المفتوحة فوق طلبات أُغلقت للتوّ تبقى معلّقة وتحجب أصحابها في
    // `findProviderIdsWithOpenOffers` — تُغلق معها لا بعدها.
    const offers = db.collection('requestoffers');
    const openOffers = await offers.updateMany(
      { status: 'offered' },
      { $set: { status: 'expired', closedAt: now, closeReason: 'إغلاق بيانات تجريبية قبل العرض' } },
    );

    const stillBusy = await orders.distinct('provider', {
      status: { $in: ENGAGING_ORDER_STATUSES },
      provider: { $ne: null },
    });

    log('✔ طلبات نشطة أُنهيت (completed): ' + completed.modifiedCount + ' من ' + activeCount);
    log('✔ طلبات معلّقة أُلغيت (cancelled): ' + cancelled.modifiedCount + ' من ' + pendingCount);
    log('✔ عروض مفتوحة أُغلقت: ' + openOffers.modifiedCount);
    log('');
    log('مزوّدون ما زالوا محسوبين «مشغولين»: ' + stillBusy.length + (takeAll ? '' : ' (طلبات أحدث من ' + STALE_HOURS + ' ساعة — أضف --all لإغلاقها)'));
  } finally {
    await client.close();
  }
})().catch((error) => {
  console.error('✖ فشل تحرير الطلبات:', error.message);
  process.exit(1);
});
