// ============================================================
//  التراجع عن تجهيز العرض — يعيد ما كتبته سكربتات `scripts/demo` وحدها
//
//  الاستعمال:
//    node scripts/demo/restore-demo-state.cjs <مسار مجلّد النسخة>
//
//  يُعيد الحقول المنسوخة كما كانت بالضبط، بما فيها **حذف** الحقول التي لم
//  تكن موجودة أصلاً: مزوّد لم يكن يملك `servicePrices` قبل التجهيز يجب أن
//  يعود بلا الحقل لا بخريطة فارغة — وإلا بقي أثر «تراجعٍ» لم يكتمل.
// ============================================================
const fs = require('fs');
const path = require('path');
const { connect, log } = require('./_shared.cjs');

const PROVIDER_FIELDS = [
  'status',
  'isApproved',
  'isActive',
  'accountStatus',
  'registrationStatus',
  'services',
  'servicePrices',
  'serviceAvailability',
  'serviceCategories',
  'services_list',
  'requestedServices',
  'location',
  'lastOnlineAt',
];

const ORDER_FIELDS = ['status', 'completedAt', 'cancelledAt', 'cancellationReason', 'metadata'];

function buildUpdate(snapshot, fields) {
  const $set = {};
  const $unset = {};
  for (const field of fields) {
    if (snapshot[field] === undefined) $unset[field] = '';
    else $set[field] = snapshot[field];
  }
  const update = {};
  if (Object.keys($set).length) update.$set = $set;
  if (Object.keys($unset).length) update.$unset = $unset;
  return update;
}

async function restoreCollection(db, name, file, fields) {
  if (!fs.existsSync(file)) {
    log(`… ${name}: لا ملف نسخة (${path.basename(file)}) — تُخطّى`);
    return;
  }
  const snapshots = JSON.parse(fs.readFileSync(file, 'utf8'));
  const collection = db.collection(name);
  const operations = snapshots.map((snapshot) => ({
    updateOne: { filter: { _id: snapshot._id }, update: buildUpdate(snapshot, fields) },
  }));

  let restored = 0;
  for (let i = 0; i < operations.length; i += 500) {
    const result = await collection.bulkWrite(operations.slice(i, i + 500), { ordered: false });
    restored += result.modifiedCount;
  }
  log(`✔ ${name}: أُعيدت ${restored} من ${snapshots.length} وثيقة (الباقي لم يتغيّر أصلاً)`);
}

(async () => {
  const dir = process.argv[2];
  if (!dir) {
    console.error('استعمال: node scripts/demo/restore-demo-state.cjs <مسار مجلّد النسخة>');
    process.exit(1);
  }
  if (!fs.existsSync(dir)) {
    console.error(`المسار غير موجود: ${dir}`);
    process.exit(1);
  }

  const { client, db } = await connect();
  try {
    await restoreCollection(db, 'providers', path.join(dir, 'providers.json'), PROVIDER_FIELDS);
    await restoreCollection(db, 'orders', path.join(dir, 'orders.json'), ORDER_FIELDS);
    log('\n↩ عادت القاعدة إلى ما قبل تجهيز العرض.');
  } finally {
    await client.close();
  }
})().catch((error) => {
  console.error('✖ فشل التراجع:', error.message);
  process.exit(1);
});
