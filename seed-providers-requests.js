const mongoose = require('mongoose');
require('dotenv').config();

async function seedProviderRequests() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in .env file.');
    process.exit(1);
  }

  try {
    console.log('⏳ Connecting to database...');
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const providersCollection = db.collection('providers');

    console.log(`🚀 جاري توليد بيانات (طلبات انضمام مزودين) معلقة ومرفوضة...`);

    const newProviders = [];
    const syrianCities = ['دمشق', 'حلب', 'حمص', 'اللاذقية', 'حماة', 'طرطوس'];
    const fakeNames = ['أحمد', 'محمد', 'خالد', 'محمود', 'عمر', 'طارق', 'يوسف'];
    const categories = ['كهرباء وتكييف سيارات', 'مركز صيانة ميكانيكا', 'خدمة إطارات', 'غسيل وتلميع'];

    // Generate 45 Pending Providers (طلبات معلقة)
    for (let i = 0; i < 45; i++) {
      const city = syrianCities[Math.floor(Math.random() * syrianCities.length)];
      newProviders.push({
        phone: `+9639${Math.floor(Math.random() * 89999999 + 10000000)}`,
        accountStatus: 'inactive',
        address: `${city}، سوريا`,
        averageRating: 0,
        businessName: `مركز ${fakeNames[Math.floor(Math.random() * fakeNames.length)]} للصيانة`,
        category: categories[Math.floor(Math.random() * categories.length)],
        city: city,
        governorate: city,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)), // Last 7 days
        description: 'ورشة صيانة حديثة قيد التسجيل',
        email: `provider_pending_${Date.now()}_${i}@test.com`,
        emergency247: false,
        experienceYears: Math.floor(Math.random() * 10) + 1,
        isActive: false,
        isApproved: false,
        isPhoneVerified: true,
        registrationStatus: 'pending',
        role: 'provider',
        status: 'offline',
        techCount: Math.floor(Math.random() * 5) + 1,
        totalReviews: 0
      });
    }

    // Generate 17 Rejected Providers (طلبات مرفوضة)
    for (let i = 0; i < 17; i++) {
      const city = syrianCities[Math.floor(Math.random() * syrianCities.length)];
      newProviders.push({
        phone: `+9639${Math.floor(Math.random() * 89999999 + 10000000)}`,
        accountStatus: 'inactive',
        address: `${city}، سوريا`,
        averageRating: 0,
        businessName: `ورشة ${fakeNames[Math.floor(Math.random() * fakeNames.length)]} للسيارات`,
        category: categories[Math.floor(Math.random() * categories.length)],
        city: city,
        governorate: city,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)), // Last 30 days
        description: 'مرفوض بسبب نقص الأوراق الرسمية',
        email: `provider_rejected_${Date.now()}_${i}@test.com`,
        emergency247: false,
        experienceYears: Math.floor(Math.random() * 5) + 1,
        isActive: false,
        isApproved: false,
        isPhoneVerified: true,
        registrationStatus: 'rejected',
        role: 'provider',
        status: 'offline',
        techCount: 1,
        totalReviews: 0,
        rejectionReason: 'عدم توفر وثيقة مزاولة المهنة وصور الورشة غير واضحة.'
      });
    }

    console.log('💾 جاري الحفظ في قاعدة البيانات...');
    
    await providersCollection.insertMany(newProviders);

    console.log(`✅ تمت العملية بنجاح!`);
    console.log(`🎉 تم إضافة طلبات انضمام مزودين جديدة:`);
    console.log(`  - 45 طلب انضمام معلّق (بانتظار مراجعة الإدارة)`);
    console.log(`  - 17 طلب انضمام مرفوض (تحتاج متابعة أو تم رفضها)`);
    console.log(`\n🗺️ اذهب الآن إلى لوحة التحكم واعمل Refresh، وستجد بطاقات "طلبات معلقة" و "طلبات مرفوضة" قد امتلأت بالأرقام القوية!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedProviderRequests();
