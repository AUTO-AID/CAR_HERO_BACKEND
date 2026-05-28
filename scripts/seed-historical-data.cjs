const mongoose = require('mongoose');
const MongoClient = mongoose.mongo.MongoClient;
const fs = require('fs');
const path = require('path');

const ENV_PATH = path.resolve(__dirname, '../.env');

// Read database URI from .env
function readEnv(envPath) {
  const env = {};
  if (!fs.existsSync(envPath)) return env;
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const index = trimmed.indexOf('=');
      if (index !== -1) {
        const k = trimmed.substring(0, index).trim();
        const v = trimmed.substring(index + 1).trim();
        env[k] = v;
      }
    }
  });
  return env;
}

const envVars = readEnv(ENV_PATH);
const MONGODB_URI = envVars.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('[ERROR] MONGODB_URI not found in backend .env file.');
  process.exit(1);
}

// Arabic feedback comments based on rating
const COMMENTS = {
  5: [
    "خدمة ممتازة وسريعة جداً أنصح بالتعامل معه",
    "فني محترف وخلوق ووصل في الوقت المحدد تماماً",
    "سعر مناسب وشغل نظيف جداً، الله يبارك لك",
    "استجابة سريعة لطلب الطوارئ وحل المشكلة باحترافية",
    "من أفضل الورش التي تعاملت معها، دقة وأمانة",
    "شغل ميكانيك ممتاز ومعاملة محترمة جداً",
    "وصل بسرعة وقام بسحب السيارة بحذر، خدمة رائعة",
    "سعر فحص السيارة ممتاز والفني شرح لي كل المشاكل بأمانة"
  ],
  4: [
    "شغل ممتاز ونظيف لكن السعر مرتفع قليلاً",
    "الخدمة جيدة جداً وتأخر قليلاً في الوصول بسبب الازدحام",
    "فنيين محترفين ومعاملة طيبة، أنصح بهم",
    "التصليح ممتاز والقطع أصلية، يستحق 4 نجوم",
    "خدمة سريعة وممتازة وأسعار مقبولة",
    "تعامل راقي جداً والمهندس متمكن من عمله"
  ],
  3: [
    "الخدمة متوسطة وتأخر في الوصول ساعة كاملة",
    "تم إصلاح العطل ولكن السعر كان مرتفعاً عن المتفق عليه",
    "مقبول ولكن يحتاج لتحسين الالتزام بالوقت والرد",
    "شغل جيد لكن التعامل كان جافاً بعض الشيء",
    "تم حل المشكلة بعد محاولات عديدة، يستحق تقييم متوسط",
    "الورشة مزدحمة والانتظار كان طويلاً"
  ],
  2: [
    "تجربة سيئة، تأخر كثيراً ولم يحل المشكلة بشكل كامل",
    "تعامل غير احترافي وسعر مرتفع جداً مقارنة بالشغل",
    "لا أنصح بالتعامل معه، غير ملتزم بالمواعيد المحددة",
    "الفني لم يكن لديه المعدات الكافية واضطررت للذهاب لورشة أخرى",
    "سعر السحب كان مبالغاً فيه جداً والتعامل سيء"
  ],
  1: [
    "أسوأ تجربة، تعامل فظ وتأخر 3 ساعات وأسعار خيالية",
    "لم يأتِ أبداً واضطررت للاتصال بمزود آخر بعد انتظار طويل",
    "شغل سيء جداً وتسبب في عطل إضافي بالسيارة",
    "محتالون، أخذوا مالاً كثيراً ولم يتم إصلاح السيارة بالشكل الصحيح",
    "اتصلت للطوارئ ولم يستجب أحد رغم كتابة 24 ساعة"
  ]
};

// Arabic names for mock users
const FIRST_NAMES = ["أحمد", "محمد", "علي", "محمود", "يوسف", "عمر", "خالد", "عبد الله", "مصطفى", "حمزة", "إبراهيم", "طارق", "فادي", "باسل", "سامر", "رامي", "سليم", "كريم", "زياد", "ماهر"];
const LAST_NAMES = ["العلي", "الجاسم", "الأسعد", "الخالد", "سليمان", "إدريس", "المصري", "سعيد", "الحسين", "العبود", "الحسن", "الطه", "حمدان", "منصور", "الزين", "اليوسف", "المحمود", "النعيم", "صالح", "شهاب"];

function generateRandomArabicName() {
  const f = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const l = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${f} ${l}`;
}

function generateRandomPhone() {
  // Matches /^\+963\d{9}$/
  let digits = '';
  for (let i = 0; i < 8; i++) {
    digits += Math.floor(Math.random() * 10);
  }
  return `+9639${digits}`;
}

async function seed() {
  console.log('Connecting to database...');
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db();
  console.log('[OK] Connected successfully.\n');

  // 1. Fetch real providers
  console.log('Fetching providers...');
  const providers = await db.collection('providers').find({ isActive: true, isApproved: true }).toArray();
  console.log(`[OK] Found ${providers.length} active/approved providers in database.`);

  if (providers.length === 0) {
    console.error('[ERROR] No active and approved providers found in MongoDB. Seed some providers first!');
    await client.close();
    process.exit(1);
  }

  // Assign quality tiers to providers to introduce realistic variation
  // Tier A: High quality (50%), Tier B: Average (40%), Tier C: Poor quality (10%)
  const providerTiers = {};
  providers.forEach(p => {
    const rand = Math.random();
    if (rand < 0.5) {
      providerTiers[p._id.toString()] = 'A';
    } else if (rand < 0.9) {
      providerTiers[p._id.toString()] = 'B';
    } else {
      providerTiers[p._id.toString()] = 'C';
    }
  });

  // 2. Fetch or seed system services
  console.log('Checking system services...');
  let services = await db.collection('services').find({ isActive: true }).toArray();
  if (services.length === 0) {
    console.log('No services found. Seeding default system services...');
    const defaultServices = [
      { name: 'Roadside Assistance', nameAr: 'مساعدة على الطريق', category: 'roadside_assistance', basePrice: 35000, estimatedDuration: 30, isEmergency: true, isActive: true, isSystemService: true },
      { name: 'Car Towing', nameAr: 'سحب سيارات (كرين)', category: 'towing', basePrice: 50000, estimatedDuration: 45, isEmergency: true, isActive: true, isSystemService: true },
      { name: 'Battery Replacement', nameAr: 'تبديل أو شحن البطارية', category: 'battery', basePrice: 20000, estimatedDuration: 20, isEmergency: true, isActive: true, isSystemService: true },
      { name: 'Flat Tire Change', nameAr: 'تبديل وإصلاح الإطارات', category: 'tire', basePrice: 15000, estimatedDuration: 25, isEmergency: true, isActive: true, isSystemService: true },
      { name: 'Fuel Delivery', nameAr: 'توصيل وقود (بنزين/مازوت)', category: 'fuel', basePrice: 25000, estimatedDuration: 20, isEmergency: true, isActive: true, isSystemService: true },
      { name: 'Emergency Lockout', nameAr: 'فتح أقفال السيارة المقفلة', category: 'lockout', basePrice: 30000, estimatedDuration: 30, isEmergency: true, isActive: true, isSystemService: true },
      { name: 'Periodic Maintenance', nameAr: 'صيانة دورية وتغيير زيت', category: 'maintenance', basePrice: 65000, estimatedDuration: 90, isEmergency: false, isActive: true, isSystemService: true },
      { name: 'Full Car Wash', nameAr: 'غسيل وتلميع سيارات متنقل', category: 'car_wash', basePrice: 40000, estimatedDuration: 60, isEmergency: false, isActive: true, isSystemService: true }
    ];
    await db.collection('services').insertMany(defaultServices);
    services = await db.collection('services').find({ isActive: true }).toArray();
    console.log(`[OK] Seeded ${services.length} services.`);
  } else {
    console.log(`[OK] Found ${services.length} services.`);
  }

  // 3. Fetch or seed mock users
  console.log('Checking user database...');
  let users = await db.collection('users').find({ accountType: 'customer' }).toArray();
  if (users.length < 100) {
    console.log(`Only ${users.length} users found. Seeding 500 mock customers...`);
    const mockUsers = [];
    const phoneSet = new Set(users.map(u => u.phoneNumber));
    
    while (mockUsers.length < 500) {
      const phone = generateRandomPhone();
      if (!phoneSet.has(phone)) {
        phoneSet.add(phone);
        mockUsers.push({
          fullName: generateRandomArabicName(),
          phoneNumber: phone,
          password: '$2b$10$xyzDummyHashForPasswordOnlyGraduateProjectNotProduction',
          accountType: 'customer',
          role: 'user',
          loyaltyLevel: 1,
          isPremium: Math.random() < 0.1,
          preferences: { language: 'ar', notifications: { push: true, sms: true, email: false } },
          isActive: true,
          isVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
    await db.collection('users').insertMany(mockUsers);
    users = await db.collection('users').find({ accountType: 'customer' }).toArray();
    console.log(`[OK] Total customer users is now ${users.length}.`);
  } else {
    console.log(`[OK] Found ${users.length} customer users.`);
  }

  // 4. Generate 25,000 historical orders distributed over 12 months
  console.log('\nGenerating 25,000 historical orders...');
  const orders = [];
  const now = new Date();
  
  // Status distributions: 75% completed, 15% cancelled, 7% rejected, 3% pending/in_progress
  const statuses = ['completed', 'cancelled', 'rejected', 'in_progress', 'pending'];
  const statusProbs = [0.75, 0.15, 0.07, 0.02, 0.01];

  function selectRandomWeighted(items, weights) {
    const rand = Math.random();
    let sum = 0;
    for (let i = 0; i < items.length; i++) {
      sum += weights[i];
      if (rand <= sum) return items[i];
    }
    return items[items.length - 1];
  }

  // Group services by category for easy lookup
  const servicesByCategory = {};
  services.forEach(s => {
    if (!servicesByCategory[s.category]) {
      servicesByCategory[s.category] = [];
    }
    servicesByCategory[s.category].push(s);
  });

  const cancellationReasons = [
    'المزود تأخر كثيراً في الوصول',
    'ألغيت من قبل العميل نظراً لحل المشكلة',
    'العميل لم يقم بالرد على الاتصالات',
    'خلل في تقدير المسافة أو السعر',
    'عطل بالرافعة أو الآلية الخاصة بالمزود',
    'تم حل المشكلة ذاتياً'
  ];

  for (let i = 0; i < 25000; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const provider = providers[Math.floor(Math.random() * providers.length)];
    const tier = providerTiers[provider._id.toString()] || 'B';

    // Pick service category that provider supports, fallback to random
    let category = 'other';
    if (provider.serviceCategories && provider.serviceCategories.length > 0) {
      category = provider.serviceCategories[Math.floor(Math.random() * provider.serviceCategories.length)];
    } else if (provider.category) {
      category = provider.category;
    } else {
      category = services[Math.floor(Math.random() * services.length)].category;
    }

    // Get matching service
    const matchingServices = servicesByCategory[category] || services;
    const service = matchingServices[Math.floor(Math.random() * matchingServices.length)];

    // Generate random date in the last 12 months
    const dateOffsetDays = Math.random() * 365;
    const createdAt = new Date(now.getTime() - dateOffsetDays * 24 * 60 * 60 * 1000);

    // Determine status
    const status = selectRandomWeighted(statuses, statusProbs);

    // Calculate prices
    const basePrice = service.basePrice || 30000;
    // Add realistic price noise (variance of +- 20%)
    const priceMultiplier = 0.8 + Math.random() * 0.4;
    const totalAmount = Math.round((basePrice * priceMultiplier) / 500) * 500; // round to nearest 500
    const payableAmount = totalAmount;

    // Location close to provider's location (adding small variance of +- 0.08 degrees, approx 0 - 8 km)
    const providerCoords = provider.location?.coordinates || [36.2765, 33.5138];
    const clientLng = providerCoords[0] + (Math.random() - 0.5) * 0.16;
    const clientLat = providerCoords[1] + (Math.random() - 0.5) * 0.16;

    const orderDoc = {
      _id: new mongoose.Types.ObjectId(),
      orderNumber: `CH-${createdAt.getFullYear()}${(createdAt.getMonth() + 1).toString().padStart(2, '0')}${createdAt.getDate().toString().padStart(2, '0')}-${i.toString().padStart(5, '0')}`,
      user: user._id,
      provider: provider._id,
      service: service._id,
      status: status,
      totalAmount,
      discountAmount: 0,
      payableAmount,
      location: {
        type: 'Point',
        coordinates: [clientLng, clientLat]
      },
      address: `شارع ${Math.floor(Math.random() * 20) + 1}، ${provider.city || 'دمشق'}`,
      isScheduled: Math.random() < 0.1,
      paymentStatus: status === 'completed' ? 'completed' : 'pending',
      paymentMethod: Math.random() < 0.75 ? 'cash' : 'wallet',
      createdAt,
      updatedAt: createdAt
    };

    // Calculate response, arrival and completion times for realistic noise
    let responseTimeMinutes = 15;
    let travelTimeMinutes = 30;
    let repairTimeMinutes = 40;

    if (tier === 'A') {
      responseTimeMinutes = 2 + Math.floor(Math.random() * 10); // 2-12m
      travelTimeMinutes = 10 + Math.floor(Math.random() * 20); // 10-30m
      repairTimeMinutes = 15 + Math.floor(Math.random() * 35); // 15-50m
    } else if (tier === 'B') {
      responseTimeMinutes = 5 + Math.floor(Math.random() * 20); // 5-25m
      travelTimeMinutes = 20 + Math.floor(Math.random() * 30); // 20-50m
      repairTimeMinutes = 25 + Math.floor(Math.random() * 55); // 25-80m
    } else {
      responseTimeMinutes = 15 + Math.floor(Math.random() * 45); // 15-60m
      travelTimeMinutes = 35 + Math.floor(Math.random() * 55); // 35-90m
      repairTimeMinutes = 30 + Math.floor(Math.random() * 90); // 30-120m
    }

    if (status === 'completed') {
      const acceptedAt = new Date(createdAt.getTime() + responseTimeMinutes * 60 * 1000);
      const startedAt = new Date(acceptedAt.getTime() + travelTimeMinutes * 60 * 1000);
      const completedAt = new Date(startedAt.getTime() + repairTimeMinutes * 60 * 1000);

      Object.assign(orderDoc, {
        acceptedAt,
        startedAt,
        completedAt,
        updatedAt: completedAt
      });
    } else if (status === 'cancelled') {
      const cancelledBy = selectRandomWeighted(['user', 'provider', 'system'], [0.70, 0.20, 0.10]);
      const cancellationReason = cancellationReasons[Math.floor(Math.random() * cancellationReasons.length)];
      const cancelledAt = new Date(createdAt.getTime() + (Math.random() * 30 + 5) * 60 * 1000); // cancelled in 5-35 mins

      Object.assign(orderDoc, {
        cancelledAt,
        cancelledBy,
        cancellationReason,
        updatedAt: cancelledAt
      });
    } else if (status === 'rejected') {
      const cancelledAt = new Date(createdAt.getTime() + (Math.random() * 10 + 2) * 60 * 1000);
      Object.assign(orderDoc, {
        cancelledAt,
        cancelledBy: 'provider',
        cancellationReason: 'المزود مشغول حالياً بطلب آخر',
        updatedAt: cancelledAt
      });
    }

    orders.push(orderDoc);
  }

  // Insert orders in batches of 5000 for high efficiency
  console.log('Inserting orders in batches...');
  const batchSize = 5000;
  for (let offset = 0; offset < orders.length; offset += batchSize) {
    const batch = orders.slice(offset, offset + batchSize);
    await db.collection('orders').insertMany(batch);
    console.log(` - Inserted ${offset + batch.length}/${orders.length} orders.`);
  }

  // 5. Generate 5,000 reviews for completed orders
  console.log('\nGenerating 5,000 reviews...');
  const completedOrders = orders.filter(o => o.status === 'completed');
  
  // Shuffle completed orders to pick 5,000 random ones
  completedOrders.sort(() => 0.5 - Math.random());
  const selectedOrdersForReviews = completedOrders.slice(0, 5000);
  
  const reviews = [];
  const providerStats = {}; // store accumulators to update provider profile ratings

  selectedOrdersForReviews.forEach(order => {
    const pId = order.provider.toString();
    const tier = providerTiers[pId] || 'B';
    
    // Determine rating based on provider's quality tier
    let rating = 5;
    const rand = Math.random();
    if (tier === 'A') {
      if (rand < 0.65) rating = 5;
      else if (rand < 0.90) rating = 4;
      else if (rand < 0.97) rating = 3;
      else if (rand < 0.99) rating = 2;
      else rating = 1;
    } else if (tier === 'B') {
      if (rand < 0.35) rating = 5;
      else if (rand < 0.75) rating = 4;
      else if (rand < 0.92) rating = 3;
      else if (rand < 0.97) rating = 2;
      else rating = 1;
    } else {
      if (rand < 0.15) rating = 5;
      else if (rand < 0.30) rating = 4;
      else if (rand < 0.60) rating = 3;
      else if (rand < 0.85) rating = 2;
      else rating = 1;
    }

    const commentsPool = COMMENTS[rating];
    const comment = commentsPool[Math.floor(Math.random() * commentsPool.length)];

    // Detailed ratings (variance around the main rating)
    const getVariance = (r) => Math.min(5, Math.max(1, r + (Math.random() < 0.2 ? (Math.random() < 0.5 ? 1 : -1) : 0)));

    const serviceQuality = getVariance(rating);
    const punctuality = getVariance(rating);
    const professionalism = getVariance(rating);
    const valueForMoney = getVariance(rating);

    const reviewId = new mongoose.Types.ObjectId();
    const createdAt = new Date(order.completedAt.getTime() + (Math.random() * 24 + 1) * 60 * 60 * 1000); // reviewed 1-25 hours later

    reviews.push({
      _id: reviewId,
      user: order.user,
      provider: order.provider,
      order: order._id,
      rating,
      comment,
      serviceQuality,
      punctuality,
      professionalism,
      valueForMoney,
      images: [],
      isReported: false,
      isVisible: true,
      isFlagged: false,
      helpfulCount: Math.floor(Math.random() * 5),
      createdAt,
      updatedAt: createdAt
    });

    // Update order with review reference & rating
    order.review = reviewId;
    order.rating = rating;

    // Accumulate stats for providers
    if (!providerStats[pId]) {
      providerStats[pId] = { totalRating: 0, reviewsCount: 0, ordersCount: 0 };
    }
    providerStats[pId].totalRating += rating;
    providerStats[pId].reviewsCount += 1;
  });

  // Calculate total completed/cancelled orders for each provider in our generated set
  orders.forEach(order => {
    const pId = order.provider.toString();
    if (!providerStats[pId]) {
      providerStats[pId] = { totalRating: 0, reviewsCount: 0, ordersCount: 0 };
    }
    providerStats[pId].ordersCount += 1;
  });

  // Insert reviews in batches
  console.log('Inserting reviews in batches...');
  for (let offset = 0; offset < reviews.length; offset += batchSize) {
    const batch = reviews.slice(offset, offset + batchSize);
    await db.collection('reviews').insertMany(batch);
    console.log(` - Inserted ${offset + batch.length}/${reviews.length} reviews.`);
  }

  // Update order references in the DB for those which got reviews
  console.log('Updating order review references...');
  const orderUpdates = selectedOrdersForReviews.map(order => ({
    updateOne: {
      filter: { _id: order._id },
      update: { $set: { review: order.review, rating: order.rating } }
    }
  }));

  for (let offset = 0; offset < orderUpdates.length; offset += batchSize) {
    const batch = orderUpdates.slice(offset, offset + batchSize);
    await db.collection('orders').bulkWrite(batch, { ordered: false });
    console.log(` - Updated ${offset + batch.length}/${orderUpdates.length} orders.`);
  }

  // 6. Update Provider performance metrics in database
  console.log('\nUpdating provider performance metrics in database...');
  const providerUpdates = [];

  for (const p of providers) {
    const pId = p._id.toString();
    const stats = providerStats[pId] || { totalRating: 0, reviewsCount: 0, ordersCount: 0 };

    const averageRating = stats.reviewsCount > 0 ? parseFloat((stats.totalRating / stats.reviewsCount).toFixed(2)) : 0;
    const totalReviews = stats.reviewsCount;
    const totalOrders = stats.ordersCount;

    // Cancellation calculations for metadata
    const providerOrders = orders.filter(o => o.provider.toString() === pId);
    const completedCount = providerOrders.filter(o => o.status === 'completed').length;
    const cancelledCount = providerOrders.filter(o => o.status === 'cancelled').length;
    const cancellationRate = providerOrders.length > 0 ? parseFloat((cancelledCount / providerOrders.length).toFixed(3)) : 0.05;

    providerUpdates.push({
      updateOne: {
        filter: { _id: p._id },
        update: { 
          $set: { 
            averageRating, 
            totalReviews, 
            totalOrders,
            'metadata.cancellationRate': cancellationRate
          } 
        }
      }
    });
  }

  console.log('Writing provider performance updates...');
  for (let offset = 0; offset < providerUpdates.length; offset += batchSize) {
    const batch = providerUpdates.slice(offset, offset + batchSize);
    await db.collection('providers').bulkWrite(batch, { ordered: false });
    console.log(` - Updated ${offset + batch.length}/${providerUpdates.length} providers.`);
  }

  console.log('\n[SUCCESS] Historical operational database seeding completed successfully!');
  console.log(`Total Generated Users: 500`);
  console.log(`Total Generated Orders: ${orders.length}`);
  console.log(`Total Generated Reviews: ${reviews.length}`);
  console.log(`Successfully updated performance stats for ${providers.length} providers.`);
  
  await client.close();
}

seed().catch(err => {
  console.error('Fatal error during seeding:', err);
  process.exit(1);
});
