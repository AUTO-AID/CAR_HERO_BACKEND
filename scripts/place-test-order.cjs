/**
 * ينشئ طلباً تجريبياً باسم العميل ليصل الفنّي فوراً.
 *
 * المطبّ الذي يحلّه: التطبيق يرسل موقعك **الحقيقي** عند تشغيل الاتصال،
 * فيستبدل به موقع دمشق المزروع. ولو أنشأنا الطلب على إحداثيات ثابتة ولستَ
 * فيها، سقط خارج نطاق البحث فلا يصلك عرض — وتظنّ أن النظام معطّل.
 *
 * لذلك نقرأ موقع الفنّي **كما هو الآن** في القاعدة، ونضع الطلب على بُعد
 * ~800 متر منه. يعمل أينما كنت.
 *
 *   node scripts/place-test-order.cjs            # خدمة عشوائية
 *   node scripts/place-test-order.cjs "سحب"      # خدمة باسمها
 */
const { MongoClient } = require('mongodb');

const URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/car_hero';
const API = process.env.API_URL || 'http://localhost:3001/api/v1';
const CUSTOMER_PHONE = '+963991000002';
const PROVIDER_PHONE = '+963947091764';
const PASSWORD = process.env.SEED_PASSWORD || 'Passw0rd';

/** ~800 متر شمالاً — قريب بما يكفي ليقع ضمن أضيق نطاق (10 كم) */
const OFFSET_DEGREES = 0.0072;

async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const payload = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${payload?.message ?? text}`);
  }
  return payload?.data ?? payload;
}

async function main() {
  const wanted = process.argv[2];
  const client = await MongoClient.connect(URI);
  const db = client.db();

  const provider = await db.collection('providers').findOne({ phone: PROVIDER_PHONE });
  if (!provider) throw new Error('لا يوجد فنّي مزروع. شغّل: node scripts/seed-provider-app-local.cjs');

  if (provider.status !== 'online') {
    console.log('⚠  الفنّي غير متّصل الآن — شغّل «تشغيل الاتصال» من التطبيق أولاً،');
    console.log('   وإلا لن يصله عرض (القاعدة: المتّصلون فقط).\n');
  }

  const [lng, lat] = provider.location?.coordinates ?? [];
  if (typeof lng !== 'number') throw new Error('موقع الفنّي غير مضبوط.');

  const services = await db.collection('services').find({ isActive: true }).toArray();
  const service = wanted
    ? services.find((s) => (s.nameAr || '').includes(wanted) || (s.name || '').toLowerCase().includes(wanted.toLowerCase()))
    : services[Math.floor(Math.random() * services.length)];
  if (!service) throw new Error(`لا توجد خدمة تطابق "${wanted}".`);

  const { accessToken } = await api('/auth/login', {
    method: 'POST',
    body: { phoneNumber: CUSTOMER_PHONE, password: PASSWORD },
  });

  const order = await api('/orders', {
    method: 'POST',
    token: accessToken,
    body: {
      serviceId: service._id.toString(),
      location: { coordinates: [lng, lat + OFFSET_DEGREES] },
      notes: 'طلب تجريبي — العجلة الأمامية اليمنى مثقوبة',
    },
  });

  console.log('✅ أُنشئ الطلب');
  console.log('   الخدمة  :', service.nameAr || service.name);
  console.log('   الرقم   :', order.orderNumber);
  console.log('   المسافة : ~800 م من موقع الفنّي الحالي');
  console.log('');
  console.log('   انظر إلى هاتفك — يجب أن تظهر شاشة «طلب خدمة جديد» خلال ثانيتين.');

  await client.close();
}

main().catch((error) => {
  console.error('✘', error.message);
  process.exit(1);
});
