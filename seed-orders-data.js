const mongoose = require('mongoose');
require('dotenv').config();

const ORDER_STATUSES = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'completed', 'failed'];
const PAYMENT_METHODS = ['cash', 'card', 'wallet'];

async function seedDiverseOrders() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in .env file.');
    process.exit(1);
  }

  try {
    console.log('⏳ Connecting to database...');
    await mongoose.connect(uri);
    const db = mongoose.connection.db;

    // Get collections
    const usersCollection = db.collection('users');
    const providersCollection = db.collection('providers');
    const servicesCollection = db.collection('services');
    const ordersCollection = db.collection('orders');

    // Fetch some real random users, providers, and services to link the orders to
    console.log('🔍 Fetching some random users, providers, and services...');
    const users = await usersCollection.find({}).limit(50).toArray();
    const providers = await providersCollection.find({}).limit(50).toArray();
    let services = await servicesCollection.find({}).limit(20).toArray();

    if (users.length === 0 || providers.length === 0) {
      console.log('❌ يرجى التأكد من وجود مستخدمين ومزودين في قاعدة البيانات أولاً.');
      return;
    }

    // If no services exist, create a dummy one just for the seed
    if (services.length === 0) {
      const dummyService = {
        _id: new mongoose.Types.ObjectId(),
        name: 'خدمة عامة',
        nameAr: 'فحص شامل',
        category: 'صيانة عامة',
        basePrice: 50000,
        estimatedDuration: 60,
        isActive: true,
        isSystemService: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await servicesCollection.insertOne(dummyService);
      services = [dummyService];
    }

    console.log(`🚀 جاري توليد بيانات قوية وحقيقية لـ 1000 طلب متنوع...`);

    const newOrders = [];

    const distribution = [
      { status: 'pending', count: 200 },
      { status: 'cancelled', count: 300 },
      { status: 'in_progress', count: 100 },
      { status: 'completed', count: 400 },
    ];

    let orderCounter = 0;

    distribution.forEach(dist => {
      for (let i = 0; i < dist.count; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomProvider = providers[Math.floor(Math.random() * providers.length)];
        const randomService = services[Math.floor(Math.random() * services.length)];

        // Generate realistic amounts between 50,000 and 500,000 SYP
        const amount = Math.floor(Math.random() * 450000) + 50000;

        // Generate random date within the last 30 days
        const randomPastDate = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));

        // Use crypto random or counter to guarantee uniqueness
        const uniqueString = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        newOrders.push({
          orderNumber: `ORD-${Date.now().toString().slice(-4)}-${orderCounter++}-${uniqueString}`,
          user: randomUser._id,
          provider: randomProvider._id,
          service: randomService._id,
          status: dist.status,
          totalAmount: amount,
          payableAmount: amount,
          discountAmount: 0,
          location: {
            type: 'Point',
            // Random coords in Syria approx
            coordinates: [36.0 + Math.random() * 2, 33.0 + Math.random() * 2]
          },
          isScheduled: false,
          paymentStatus: dist.status === 'completed' ? 'completed' : 'pending',
          paymentMethod: PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)],
          cancellationReason: dist.status === 'cancelled' ? 'العميل ألغى الطلب / المزود غير متاح' : null,
          cancelledBy: dist.status === 'cancelled' ? (Math.random() > 0.5 ? 'user' : 'provider') : null,
          createdAt: randomPastDate,
          updatedAt: new Date(randomPastDate.getTime() + 3600000), // 1 hour later
          metadata: {
            seeded: true
          }
        });
      }
    });

    console.log('💾 جاري الحفظ في قاعدة البيانات...');
    
    // Insert all
    await ordersCollection.insertMany(newOrders);

    console.log(`✅ تمت العملية بنجاح!`);
    console.log(`🎉 تم ضخ 1000 طلب جديد ومتنوع بنجاح:`);
    console.log(`  - 200 طلب معلّق (Pending)`);
    console.log(`  - 300 طلب مرفوض/ملغى (Cancelled)`);
    console.log(`  - 100 طلب قيد التنفيذ (In Progress)`);
    console.log(`  - 400 طلب مكتمل (Completed) لتوليد إيرادات قوية وضخمة للمنصة!`);
    console.log(`\n🗺️ اذهب إلى لوحة التحكم واعمل Refresh لترى الأرقام تشتعل!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedDiverseOrders();
