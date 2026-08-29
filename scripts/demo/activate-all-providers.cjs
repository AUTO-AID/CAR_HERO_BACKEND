// ============================================================
//  تفعيل الاتصال لكل مزوّد معتمَد — «الزرّ» مضغوطاً في القاعدة
//
//  زرّ التفعيل في تطبيق المزوّد لا يكتب إلا حقلاً واحداً:
//  `providers.status = 'online' | 'offline'` (`SetProviderPresenceUseCase`).
//  ولا مهمّة دورية تعيده إلى `offline` — فما يكتبه هذا السكربت ثابت.
//
//  **لماذا؟** مزوّدو القاعدة منشآت حقيقية مستوردة، لا أحد منهم يحمل التطبيق
//  ليضغط الزرّ بنفسه. وبدون `online` لا يظهر أيٌّ منهم في بحث العميل ولا
//  يصله عرض: `/providers/nearby` و`create-order` و`ProviderDispatchService`
//  ثلاثتها تشترطه.
//
//  حدّان صارمان:
//   ١. **المعتمَدون وحدهم** (`isApproved && isActive !== false`). المعلّقون
//      والمرفوضون يبقون كما هم: هم مادة عرض شاشة الموافقات في لوحة الأدمن،
//      وتفعيلهم يمحو تلك القصّة ويناقض معنى «قيد المراجعة».
//   ٢. **مزوّد العرض يُترك مطفأً عمداً** — صاحبه يسجّل دخوله أمام اللجنة
//      ويضغط الزرّ حيّاً، فيجب أن يكون هناك ما يُضغط.
//
//  الحالة `busy` تُعامَل كـ`offline`: لا يكتبها شيء في المنظومة (انظر تعليق
//  `findNearestAvailableProvider`)، فهي بقايا بذرٍ قديم تُستبعد من كل استعلام.
// ============================================================
const { connect, demoProvider, log } = require('./_shared.cjs');

(async () => {
  const { client, db } = await connect();
  try {
    const demo = await demoProvider(db);
    const providers = db.collection('providers');

    const eligible = {
      _id: { $ne: demo._id },
      isApproved: true,
      isActive: { $ne: false },
    };

    const before = await providers.countDocuments({ ...eligible, status: 'online' });
    const total = await providers.countDocuments(eligible);

    const result = await providers.updateMany(
      { ...eligible, status: { $ne: 'online' } },
      { $set: { status: 'online', lastOnlineAt: new Date() } },
    );

    // مزوّد العرض مطفأ دائماً بعد هذا السكربت: تشغيله بيده هو أول لقطة في
    // الفيديو، وتركه متّصلاً من محاولة سابقة يُفقد اللقطة معناها.
    const demoReset = await providers.updateOne(
      { _id: demo._id, status: { $ne: 'offline' } },
      { $set: { status: 'offline' } },
    );

    const skipped = await providers.countDocuments({
      _id: { $ne: demo._id },
      $or: [{ isApproved: { $ne: true } }, { isActive: false }],
    });

    log('✔ متّصلون الآن: ' + total + ' مزوّداً معتمَداً (كانوا ' + before + ')');
    log('  غُيّرت حالة: ' + result.modifiedCount);
    log('  تُركوا كما هم (معلّق/مرفوض/معطّل): ' + skipped);
    log('  مزوّد العرض «' + demo.businessName + '»: ' + (demoReset.modifiedCount ? 'أُعيد إلى offline' : 'مطفأ أصلاً') + ' — يشغّله صاحبه بيده.');
  } finally {
    await client.close();
  }
})().catch((error) => {
  console.error('✖ فشل تفعيل المزوّدين:', error.message);
  process.exit(1);
});
