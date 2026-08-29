// ============================================================
//  نسخة احتياطية قبل تجهيز العرض — تُقرأ من `restore-demo-state.cjs`
//
//  لا تُنسخ الوثائق كاملةً: ما تغيّره سكربتات العرض حقولٌ معدودة، ونسخ ٣٧ ألف
//  طلب كاملاً لأجل حقل `status` واحد يُنتج ملفاً بمئات الميغابايت لا يقرؤه
//  أحد. نُسجّل ما سيُكتب فوقه فقط — وهو ما يكفي للتراجع الكامل.
// ============================================================
const fs = require('fs');
const path = require('path');
const { connect, ENGAGING_ORDER_STATUSES, log } = require('./_shared.cjs');

(async () => {
  const { client, db } = await connect();
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dir = path.resolve(__dirname, '../../../mongodb-dumps', `pre-demo-${stamp}`);
    fs.mkdirSync(dir, { recursive: true });

    const providers = await db
      .collection('providers')
      .find({}, {
        projection: {
          status: 1,
          isApproved: 1,
          isActive: 1,
          accountStatus: 1,
          registrationStatus: 1,
          services: 1,
          servicePrices: 1,
          serviceAvailability: 1,
          serviceCategories: 1,
          services_list: 1,
          requestedServices: 1,
          location: 1,
          lastOnlineAt: 1,
        },
      })
      .toArray();
    fs.writeFileSync(path.join(dir, 'providers.json'), JSON.stringify(providers), 'utf8');
    log(`✔ providers: ${providers.length} وثيقة`);

    const orders = await db
      .collection('orders')
      .find(
        { status: { $in: [...ENGAGING_ORDER_STATUSES, 'pending'] } },
        { projection: { status: 1, completedAt: 1, cancelledAt: 1, cancellationReason: 1, metadata: 1 } },
      )
      .toArray();
    fs.writeFileSync(path.join(dir, 'orders.json'), JSON.stringify(orders), 'utf8');
    log(`✔ orders (نشطة + معلّقة): ${orders.length} وثيقة`);

    fs.writeFileSync(
      path.join(dir, 'README.txt'),
      [
        'نسخة احتياطية أُخذت قبل تجهيز بيانات عرض المناقشة.',
        `التاريخ: ${new Date().toISOString()}`,
        '',
        'للتراجع الكامل:',
        `  node scripts/demo/restore-demo-state.cjs "${dir}"`,
        '',
        'providers.json — حقول الحالة والخدمات والموقع لكل المزوّدين.',
        'orders.json    — حالة كل طلب كان نشِطاً أو معلّقاً لحظة النسخ.',
      ].join('\n'),
      'utf8',
    );

    log(`\n📦 النسخة في: ${dir}`);
    log(`   للتراجع لاحقاً: node scripts/demo/restore-demo-state.cjs "${dir}"`);
  } finally {
    await client.close();
  }
})().catch((error) => {
  console.error('✖ فشل أخذ النسخة الاحتياطية:', error.message);
  process.exit(1);
});
