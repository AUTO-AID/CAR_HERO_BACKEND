/**
 * حذف رقم/أرقام مزوّد من القاعدة عبر كل المجموعات المرتبطة.
 *
 * الرقم مفتاح ربط بين users و providers و pending_registrations، ويُخزَّن دائماً
 * بصيغة E.164 (+963XXXXXXXXX). هذا السكربت يطبّع أي صيغة تدخلها إلى نفس الصيغة
 * ثم يحذفها من الثلاث مجموعات معاً حتى لا تبقى بقايا تمنع إعادة التسجيل.
 *
 * الاستخدام (من مجلّد CAR_HERO_BACKEND):
 *   node scripts/delete-provider-numbers.cjs                 # يسرد كل أرقام المزوّدين
 *   node scripts/delete-provider-numbers.cjs 0912345678 0987654321        # معاينة فقط (لا حذف)
 *   node scripts/delete-provider-numbers.cjs 0912345678 0987654321 --yes  # الحذف الفعلي
 */
const { MongoClient } = require('mongodb');

const uri =
  process.env.LOCAL_MONGODB_URI ||
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/car_hero';

// حماية: هذا السكربت للقاعدة المحلية فقط
if (!/^(mongodb:\/\/(127\.0\.0\.1|localhost)|mongodb:\/\/\[::1\])/.test(uri)) {
  console.error(`❌ رفض التشغيل على قاعدة غير محلية: ${uri}`);
  process.exit(1);
}

function normalizeSyrianPhone(input) {
  const digits = String(input || '').replace(/[^\d]/g, '');
  if (/^09\d{8}$/.test(digits)) return `+963${digits.slice(1)}`;
  if (/^9639\d{8}$/.test(digits)) return `+${digits}`;
  return String(input || '').trim();
}

const args = process.argv.slice(2);
const doDelete = args.includes('--yes');
const rawNumbers = args.filter((a) => a !== '--yes');
const numbers = [...new Set(rawNumbers.map(normalizeSyrianPhone))];

// المجموعات وحقل الهاتف في كل منها
const TARGETS = [
  { collection: 'users', field: 'phoneNumber' },
  { collection: 'providers', field: 'phone' },
  { collection: 'pending_registrations', field: 'phoneNumber' },
];

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  // بلا أرقام: اسرد أرقام المزوّدين لمساعدتك على تحديد الرقمين
  if (numbers.length === 0) {
    console.log('\nℹ️  لم تمرّر أرقاماً. هذه أرقام المزوّدين الموجودة:\n');
    const providers = await db
      .collection('providers')
      .find({}, { projection: { phone: 1, businessName: 1, fullName: 1, role: 1 } })
      .toArray();
    if (!providers.length) {
      console.log('   (لا يوجد أي مزوّد في مجموعة providers)');
    }
    for (const p of providers) {
      console.log(`   ${p.phone}  —  ${p.businessName || p.fullName || ''}`);
    }
    const provUsers = await db
      .collection('users')
      .find({ accountType: 'provider' }, { projection: { phoneNumber: 1, fullName: 1 } })
      .toArray();
    console.log(`\n   حسابات users بنوع provider: ${provUsers.length}`);
    for (const u of provUsers) {
      console.log(`   ${u.phoneNumber}  —  ${u.fullName || ''}`);
    }
    console.log(
      '\nثم شغّل:  node scripts/delete-provider-numbers.cjs <رقم1> <رقم2>  للمعاينة، وأضف --yes للحذف.\n',
    );
    await client.close();
    return;
  }

  console.log(`\nالأرقام (بعد التطبيع): ${numbers.join(', ')}`);
  console.log(doDelete ? '🔴 وضع الحذف الفعلي\n' : '🟡 وضع المعاينة فقط (لن يُحذف شيء)\n');

  for (const { collection, field } of TARGETS) {
    const filter = { [field]: { $in: numbers } };
    const found = await db.collection(collection).find(filter).toArray();
    if (!found.length) {
      console.log(`• ${collection}: لا مطابقات`);
      continue;
    }
    console.log(`• ${collection}: ${found.length} مستند`);
    for (const doc of found) {
      console.log(`    _id=${doc._id}  ${field}=${doc[field]}`);
    }
    if (doDelete) {
      const res = await db.collection(collection).deleteMany(filter);
      console.log(`    🗑️  حُذف ${res.deletedCount}`);
    }
  }

  if (!doDelete) {
    console.log('\nلتنفيذ الحذف أضف --yes إلى نفس الأمر.\n');
  } else {
    console.log('\n✅ تم.\n');
  }

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
