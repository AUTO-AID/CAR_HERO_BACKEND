/**
 * بذرة تطوير محلّية لتطبيق الفنّي.
 *
 * تُنشئ ما يكفي لتشغيل التطبيق فعلياً: خدمة، وفنّياً معتمداً بحساب مستخدم
 * مرتبط، وعميلاً. تعمل مراراً بلا تكرار (upsert على الهاتف/الاسم).
 *
 * كلمة المرور واحدة للحسابين: Passw0rd
 *
 *   node scripts/seed-provider-app-local.cjs
 */
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');

const URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/car_hero';
const PASSWORD = process.env.SEED_PASSWORD || 'Passw0rd';

// دمشق — مركز المدينة. الفنّي والعميل متجاوران كي يجدهما البحث الجغرافي.
const PROVIDER_COORDS = [36.2765, 33.5138];

const PROVIDER_PHONE = '+963947091764';
const CUSTOMER_PHONE = '+963991000002';

const allDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(
  (day) => ({ day, open: '00:00', close: '23:59', isClosed: false }),
);

async function main() {
  const client = await MongoClient.connect(URI);
  const db = client.db();
  const hashed = await bcrypt.hash(PASSWORD, 10);

  // ---------- الخدمات ----------
  const services = [
    { name: 'Tire Change', nameAr: 'تغيير إطار', category: 'tire', basePrice: 45 },
    { name: 'Battery Jump', nameAr: 'شحن بطارية', category: 'battery', basePrice: 35 },
    { name: 'Fuel Delivery', nameAr: 'توصيل وقود', category: 'fuel', basePrice: 30 },
    { name: 'Towing', nameAr: 'سحب مركبة', category: 'towing', basePrice: 80 },
  ];

  const serviceIds = [];
  for (const service of services) {
    const { value } = await db.collection('services').findOneAndUpdate(
      { name: service.name },
      {
        $set: { ...service, estimatedDuration: 30, isActive: true },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true, returnDocument: 'after' },
    );
    const doc = value || (await db.collection('services').findOne({ name: service.name }));
    serviceIds.push(doc._id);
  }

  // ---------- الفنّي ----------
  await db.collection('providers').updateOne(
    { phone: PROVIDER_PHONE },
    {
      $set: {
        businessName: 'ورشة النخبة لمساعدة الطريق',
        ownerName: 'م. سامر خالد',
        location: { type: 'Point', coordinates: PROVIDER_COORDS },
        city: 'دمشق',
        governorate: 'دمشق',
        address: 'شارع بغداد، دمشق',
        services: serviceIds,
        serviceAvailability: {},
        servicePrices: {},
        workingHours: allDay,
        // معتمد ومفعّل: `ProviderContextService` يرفض الدخول دونهما
        isApproved: true,
        isActive: true,
        accountStatus: 'active',
        registrationStatus: 'approved',
        // يبدأ غير متّصل — التطبيق هو من يشغّل الاتصال
        status: 'offline',
      },
      $setOnInsert: { averageRating: 0, totalOrders: 0, createdAt: new Date() },
    },
    { upsert: true },
  );
  await db.collection('providers').createIndex({ location: '2dsphere' });

  // ---------- الحسابات ----------
  for (const [phone, fullName, accountType] of [
    [PROVIDER_PHONE, 'م. نذير عيان', 'provider'],
    [CUSTOMER_PHONE, 'محمد المعراوي', 'customer'],
  ]) {
    await db.collection('users').updateOne(
      { phoneNumber: phone },
      {
        $set: {
          fullName,
          phoneNumber: phone,
          password: hashed,
          accountType,
          isVerified: true,
          isActive: true,
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );
  }

  console.log('✅ تمت التهيئة على', URI);
  console.log('');
  console.log('   الفنّي   :', PROVIDER_PHONE, '/', PASSWORD);
  console.log('   العميل   :', CUSTOMER_PHONE, '/', PASSWORD);
  console.log('   الخدمات  :', serviceIds.length);
  console.log('');
  console.log('   في التطبيق أدخل الرقم بصيغة 947091764 (بلا +963).');

  await client.close();
}

main().catch((error) => {
  console.error('فشلت التهيئة:', error);
  process.exit(1);
});
