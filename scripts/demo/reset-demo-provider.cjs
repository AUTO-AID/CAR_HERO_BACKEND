// ============================================================
//  إعادة مزوّد العرض إلى نقطة الصفر — يُشغَّل **بعد كل محاولة تصوير**
//
//  السبب ليس تجميلاً: `UpdateProviderLocationUseCase` يكتب كل نبضة تتبّع في
//  **موقع الملف الشخصي** أيضاً لا في خطّ الطلب وحده. فبعد أن تمشي السيارة
//  إلى العميل تصير «ورشة ابو حميد» مسجّلةً عند موقع العميل، وتبدأ المحاولة
//  التالية بورشة انتقلت كيلومترات عن عين اللوزة — فلا يعود الترتيب في قائمة
//  الاختيار هو نفسه ولا العنوان المعروض صحيحاً.
//
//  ما يُعاد: الإحداثيات، والعنوان النصّي، وحالة الاتصال (مطفأ ليُضغط الزرّ
//  حيّاً أمام اللجنة)، وإغلاق أي طلب بقي نشِطاً من المحاولة السابقة.
// ============================================================
const {
  connect,
  demoProvider,
  DEMO_PROVIDER_LOCATION,
  ENGAGING_ORDER_STATUSES,
  log,
} = require('./_shared.cjs');

const ADDRESS = 'حي عين اللوزة';
const CITY = 'حماة';

(async () => {
  const { client, db } = await connect();
  try {
    const demo = await demoProvider(db);
    const now = new Date();

    const previous = demo.location?.coordinates || [];
    await db.collection('providers').updateOne(
      { _id: demo._id },
      {
        $set: {
          location: { type: 'Point', coordinates: DEMO_PROVIDER_LOCATION },
          address: ADDRESS,
          city: CITY,
          governorate: CITY,
          status: 'offline',
        },
      },
    );

    // طلب بقي نشِطاً يمنع صاحبه من إيقاف الاتصال («لا يمكن إيقاف الاتصال
    // ولديك طلب نشِط») ويستبعده من الترشيح — فتبدأ المحاولة التالية بمزوّد
    // لا يظهر في القائمة أصلاً.
    const stuck = await db.collection('orders').updateMany(
      { provider: demo._id, status: { $in: [...ENGAGING_ORDER_STATUSES, 'pending', 'awaiting_customer_confirmation'] } },
      {
        $set: {
          status: 'completed',
          completedAt: now,
          'metadata.demoClosure': { closedBy: 'reset-demo-provider', at: now },
        },
      },
    );

    const offers = await db.collection('requestoffers').updateMany(
      { providerId: demo._id, status: 'offered' },
      { $set: { status: 'expired', closedAt: now, closeReason: 'إعادة ضبط قبل محاولة تصوير جديدة' } },
    );

    log('✔ «' + demo.businessName + '» أُعيد إلى ' + CITY + ' — ' + ADDRESS);
    log('  الإحداثيات: [' + DEMO_PROVIDER_LOCATION.join(', ') + ']');
    if (previous.length) {
      log('  (كانت: [' + previous.join(', ') + '])');
    }
    log('  الاتصال: مطفأ — جاهز ليُضغط الزرّ أمام اللجنة');
    log('  طلبات عالقة أُغلقت: ' + stuck.modifiedCount + ' · عروض: ' + offers.modifiedCount);
  } finally {
    await client.close();
  }
})().catch((error) => {
  console.error('✖ فشلت إعادة الضبط:', error.message);
  process.exit(1);
});
