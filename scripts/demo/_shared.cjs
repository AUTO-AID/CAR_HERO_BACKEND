// ============================================================
//  أدوات مشتركة لسكربتات تجهيز العرض التقديمي (مناقشة التخرّج)
//
//  كلّها تعمل على القاعدة المحلية مباشرةً لا عبر الـAPI: ما تفعله (تفعيل
//  ألفَي مزوّد، إغلاق آلاف الطلبات) ليس فعلاً يملكه أي مستخدم في المنظومة،
//  ولا يجوز أن يوجد له مسار HTTP يمكن استدعاؤه من الخارج.
//
//  **مؤقّتة بطبيعتها.** `restore-demo-state.cjs` يعيد كل ما غيّرته هذه
//  السكربتات من النسخة التي يكتبها `backup-demo-state.cjs`.
// ============================================================
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/car_hero';

/**
 * المزوّد الذي **لا يُلمس**: صاحبه يسجّل دخوله بنفسه أمام اللجنة ويضغط زرّ
 * التفعيل حيّاً، فيجب أن يبقى سلوكه طبيعياً تماماً — مطفأً حتى يشغّله بيده.
 */
const DEMO_PROVIDER_PHONE = '+963947091764';

/** موقع الورشة: حماة — حي عين اللوزة. تكتبه نبضات التتبّع فيحتاج إعادة ضبط */
const DEMO_PROVIDER_LOCATION = [36.75792574882508, 35.12517554599443];

/** الحالات التي تجعل المزوّد «مشغولاً» فيُستبعد من الترشيح والتوزيع */
const ENGAGING_ORDER_STATUSES = [
  'accepted',
  'provider_assigned',
  'provider_en_route',
  'provider_arrived',
  'in_progress',
];

async function connect() {
  const client = await MongoClient.connect(MONGODB_URI);
  return { client, db: client.db() };
}

/** وثيقة المزوّد المستثنى — تُقرأ مرّة وتُمرَّر، فلا يتكرّر البحث بالهاتف */
async function demoProvider(db) {
  const provider = await db.collection('providers').findOne({ phone: DEMO_PROVIDER_PHONE });
  if (!provider) {
    throw new Error(`لم يُعثر على مزوّد العرض (${DEMO_PROVIDER_PHONE}) — أوقفتُ التنفيذ بدل تعديل الجميع بلا استثناء.`);
  }
  return provider;
}

/**
 * عشوائية ثابتة مشتقّة من معرّف المزوّد.
 *
 * `Math.random` كان سيعطي توزيعاً مختلفاً في كل تشغيل: تعيد السكربت فتتبدّل
 * خدمات كل الورش، وتصير قائمةُ اختيارٍ صوّرتها البارحة غيرَها اليوم. المشتقّ
 * من المعرّف يعطي نفس النتيجة دائماً لنفس المزوّد.
 */
function seededRandom(seed) {
  let hash = 0;
  const text = String(seed);
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return () => {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    return hash / 0x100000000;
  };
}

const log = (...args) => console.log(...args);

module.exports = {
  MongoClient,
  ObjectId,
  MONGODB_URI,
  DEMO_PROVIDER_PHONE,
  DEMO_PROVIDER_LOCATION,
  ENGAGING_ORDER_STATUSES,
  connect,
  demoProvider,
  seededRandom,
  log,
};
