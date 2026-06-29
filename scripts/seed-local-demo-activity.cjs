const { MongoClient, ObjectId } = require('mongodb');

const DEFAULT_URI = 'mongodb://127.0.0.1:27017/car_hero';
const GENERATED_BY = 'local-demo-activity-v1';

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/, '').split('=');
    return [key, value ?? true];
  }),
);

const uri = process.env.LOCAL_MONGODB_URI || process.env.MONGODB_URI || DEFAULT_URI;
const isLocalUri = /^(mongodb:\/\/(127\.0\.0\.1|localhost)|mongodb:\/\/\[::1\])/.test(uri);

if (!isLocalUri && !args.has('allow-non-local')) {
  console.error(`Refusing to seed a non-local MongoDB URI: ${uri}`);
  console.error('Set LOCAL_MONGODB_URI to mongodb://127.0.0.1:27017/car_hero or pass --allow-non-local explicitly.');
  process.exit(1);
}

const options = {
  days: Number(args.get('days') || 45),
  providers: args.has('providers') ? Number(args.get('providers')) : 0,
  users: args.has('users') ? Number(args.get('users')) : 180,
  orders: Number(args.get('orders') || 2400),
  reviews: Number(args.get('reviews') || 720),
  intervalMinutes: Number(args.get('interval-minutes') || 15),
  watch: args.has('watch'),
};

const orderStatuses = [
  ['completed', 0.72],
  ['cancelled', 0.10],
  ['accepted', 0.05],
  ['provider_en_route', 0.04],
  ['provider_arrived', 0.03],
  ['in_progress', 0.03],
  ['awaiting_customer_confirmation', 0.02],
  ['pending', 0.01],
];

const paymentMethods = ['cash', 'wallet', 'card', 'cham_cash'];
const categories = ['roadside_assistance', 'towing', 'battery', 'tire', 'fuel', 'lockout', 'maintenance', 'car_wash'];
const serviceLabels = {
  roadside_assistance: ['مساعدة طريق', 'فحص سريع', 'إنقاذ مركبة'],
  towing: ['سحب مركبة', 'رافعة طريق', 'نقل للورشة'],
  battery: ['تشغيل بطارية', 'تبديل بطارية', 'فحص دينمو'],
  tire: ['تبديل إطار', 'ترقيع إطار', 'نفخ ومعايرة'],
  fuel: ['توصيل وقود', 'فحص تسريب وقود'],
  lockout: ['فتح سيارة', 'مفتاح طوارئ'],
  maintenance: ['صيانة ميكانيك', 'فحص كمبيوتر', 'تبديل زيت'],
  car_wash: ['غسيل خارجي', 'غسيل شامل', 'تعقيم داخلي'],
};

const cities = [
  { city: 'دمشق', governorate: 'دمشق', coordinates: [36.2913, 33.5138], weight: 0.20 },
  { city: 'حلب', governorate: 'حلب', coordinates: [37.1612, 36.2021], weight: 0.16 },
  { city: 'حمص', governorate: 'حمص', coordinates: [36.7234, 34.7324], weight: 0.12 },
  { city: 'حماة', governorate: 'حماة', coordinates: [36.7520, 35.1318], weight: 0.10 },
  { city: 'اللاذقية', governorate: 'اللاذقية', coordinates: [35.7796, 35.5317], weight: 0.09 },
  { city: 'طرطوس', governorate: 'طرطوس', coordinates: [35.8866, 34.8890], weight: 0.08 },
  { city: 'درعا', governorate: 'درعا', coordinates: [36.1021, 32.6189], weight: 0.07 },
  { city: 'السويداء', governorate: 'السويداء', coordinates: [36.5663, 32.7090], weight: 0.06 },
  { city: 'القنيطرة', governorate: 'القنيطرة', coordinates: [35.8246, 33.1259], weight: 0.04 },
  { city: 'دير الزور', governorate: 'دير الزور', coordinates: [40.1408, 35.3359], weight: 0.04 },
  { city: 'الرقة', governorate: 'الرقة', coordinates: [39.0209, 35.9500], weight: 0.025 },
  { city: 'الحسكة', governorate: 'الحسكة', coordinates: [40.7477, 36.5024], weight: 0.015 },
];

const firstNames = ['أحمد', 'محمد', 'عمر', 'ليان', 'نور', 'سارة', 'رامي', 'مها', 'كريم', 'جود', 'يزن', 'لمى'];
const lastNames = ['الخطيب', 'الحسن', 'النعيمي', 'الحموي', 'الشامي', 'الديري', 'القدسي', 'العلي', 'المصري', 'الحلبي'];
const businessWords = ['المحترف', 'السريع', 'الأمان', 'النخبة', 'الشام', 'الأول', 'الحديث', 'الطريق'];
const businessTypes = ['لخدمات السيارات', 'للطوارئ', 'لصيانة المركبات', 'للإطارات والبطاريات', 'للرعاية السريعة'];
const reviewComments = [
  'الخدمة وصلت بسرعة والفني شرح المشكلة بوضوح.',
  'تعامل ممتاز وسعر منطقي، التجربة كانت مريحة.',
  'تم حل المشكلة من أول زيارة، أنصح بالتعامل معهم.',
  'الموعد كان دقيقاً والمتابعة بعد الخدمة جيدة.',
  'جودة العمل عالية والتواصل منظم.',
  'الخدمة جيدة جداً مع ملاحظة بسيطة على مدة الانتظار.',
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(items) {
  return items[randomInt(0, items.length - 1)];
}

function weightedPick(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let point = Math.random() * total;
  for (const item of items) {
    point -= item.weight;
    if (point <= 0) return item;
  }
  return items[items.length - 1];
}

function pickWeightedPairs(pairs) {
  const total = pairs.reduce((sum, pair) => sum + pair[1], 0);
  let point = Math.random() * total;
  for (const [value, weight] of pairs) {
    point -= weight;
    if (point <= 0) return value;
  }
  return pairs[pairs.length - 1][0];
}

function jitterCoordinates([lng, lat], radius = 0.08) {
  return [
    Number((lng + (Math.random() - 0.5) * radius).toFixed(6)),
    Number((lat + (Math.random() - 0.5) * radius).toFixed(6)),
  ];
}

function dateWithinLastDays(days, preferRecent = true) {
  const now = new Date();
  const age = preferRecent ? Math.pow(Math.random(), 0.72) * days : Math.random() * days;
  const date = new Date(now.getTime() - age * 24 * 60 * 60 * 1000);
  date.setHours(randomInt(7, 22), randomInt(0, 59), randomInt(0, 59), 0);
  return date;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function uniquePhone(existing, prefix = '+9639') {
  for (let i = 0; i < 5000; i += 1) {
    const phone = `${prefix}${randomInt(10000000, 99999999)}`;
    if (!existing.has(phone)) {
      existing.add(phone);
      return phone;
    }
  }
  throw new Error('Could not generate a unique phone number');
}

function orderNumber(date, index) {
  const stamp = date.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  return `CH-DEMO-${stamp}-${index}-${randomInt(1000, 9999)}`;
}

function slugify(input) {
  return input
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();
}

async function insertMany(collection, docs) {
  if (!docs.length) return { insertedCount: 0 };
  return collection.insertMany(docs, { ordered: false });
}

async function ensureWallets(db, owners, ownerType, createdAt) {
  const wallets = db.collection('wallets');
  const docs = owners.map((ownerId) => ({
    ownerId,
    ownerType,
    balance: randomInt(150, 2500),
    loyaltyPoints: ownerType === 'user' ? randomInt(20, 650) : 0,
    pendingBalance: ownerType === 'provider' ? randomInt(0, 1200) : 0,
    currency: 'SAR',
    isActive: true,
    metadata: { generatedBy: GENERATED_BY },
    createdAt,
    updatedAt: createdAt,
  }));
  if (!docs.length) return [];
  await wallets.bulkWrite(
    docs.map((doc) => ({
      updateOne: {
        filter: { ownerId: doc.ownerId, ownerType: doc.ownerType },
        update: { $setOnInsert: doc },
        upsert: true,
      },
    })),
    { ordered: false },
  );
  return wallets.find({ ownerId: { $in: owners }, ownerType }).toArray();
}

async function seedOnce(batchOptions) {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  const now = new Date();
  const runId = `${now.toISOString()}-${randomInt(1000, 9999)}`;

  try {
    const [services, existingUsers, existingProviders] = await Promise.all([
      db.collection('services').find({ isActive: { $ne: false } }).toArray(),
      db.collection('users').find({ accountType: 'customer', isActive: { $ne: false } }).project({ _id: 1, phoneNumber: 1 }).toArray(),
      db.collection('providers').find({ isActive: { $ne: false }, registrationStatus: 'approved' }).project({
        _id: 1, phone: 1, city: 1, governorate: 1, location: 1, serviceCategories: 1, services: 1, category: 1,
      }).toArray(),
    ]);

    if (!services.length || !existingUsers.length || !existingProviders.length) {
      throw new Error('Database needs active services, users, and providers before activity can be generated.');
    }

    const existingPhones = new Set([
      ...(await db.collection('users').distinct('phoneNumber')),
      ...(await db.collection('providers').distinct('phone')),
    ].filter(Boolean));

    const users = [];
    for (let i = 0; i < batchOptions.users; i += 1) {
      const createdAt = dateWithinLastDays(batchOptions.days, true);
      const isPremium = Math.random() < 0.22;
      users.push({
        fullName: `${pick(firstNames)} ${pick(lastNames)}`,
        phoneNumber: uniquePhone(existingPhones),
        password: '$2b$10$localDemoHashNotForProduction00000000000000000000',
        profileImage: null,
        accountType: 'customer',
        role: 'user',
        loyaltyLevel: randomInt(1, 5),
        isPremium,
        premiumExpiresAt: isPremium ? addMinutes(now, randomInt(8, 75) * 24 * 60) : null,
        preferences: {
          language: Math.random() < 0.86 ? 'ar' : 'en',
          notifications: { push: true, sms: Math.random() < 0.8, email: Math.random() < 0.35 },
        },
        isActive: Math.random() > 0.03,
        isTermsAccepted: true,
        isVerified: true,
        lastLoginAt: dateWithinLastDays(14, true),
        vehicles: [],
        metadata: { generatedBy: GENERATED_BY, runId },
        createdAt,
        updatedAt: createdAt,
      });
    }
    const insertedUsers = await insertMany(db.collection('users'), users);
    const newUsers = insertedUsers.insertedIds ? Object.values(insertedUsers.insertedIds) : [];

    const providerDocs = [];
    for (let i = 0; i < batchOptions.providers; i += 1) {
      const area = weightedPick(cities);
      const category = pick(categories);
      const createdAt = dateWithinLastDays(Math.min(batchOptions.days, 30), true);
      const businessName = `${pick(businessWords)} ${pick(businessTypes)}`;
      const status = pickWeightedPairs([['online', 0.35], ['offline', 0.50], ['busy', 0.15]]);
      const emergency = ['towing', 'battery', 'tire', 'fuel', 'lockout', 'roadside_assistance'].includes(category) && Math.random() < 0.55;
      providerDocs.push({
        phone: uniquePhone(existingPhones),
        email: `demo-provider-${Date.now()}-${i}@carhero.local`,
        website: Math.random() < 0.45 ? `https://demo-${Date.now()}-${i}.carhero.local` : null,
        facebookUrl: Math.random() < 0.35 ? `https://facebook.com/carhero.demo.${Date.now()}.${i}` : null,
        businessName,
        ownerName: `${pick(firstNames)} ${pick(lastNames)}`,
        description: `مزود تجريبي غني للوحة التحكم يقدم ${pick(serviceLabels[category])} في ${area.city} مع بيانات حديثة للاختبار المحلي.`,
        businessType: 'workshop',
        category,
        slug: `${slugify(businessName)}-${randomInt(1000, 9999)}`,
        logo: Math.random() < 0.55 ? 'https://placehold.co/400x240?text=CarHero' : null,
        images: [],
        role: 'provider',
        status,
        accountStatus: 'active',
        accountType: Math.random() < 0.7 ? 'workshop' : 'mobile_technician',
        registrationStatus: 'approved',
        isApproved: true,
        isActive: true,
        location: { type: 'Point', coordinates: jitterCoordinates(area.coordinates) },
        address: `${area.city} - منطقة خدمة ${randomInt(1, 12)}`,
        city: area.city,
        governorate: area.governorate,
        country: 'Syria',
        coverageAreas: [area.city, area.governorate],
        serviceCategories: Array.from(new Set([category, pick(categories)])),
        services: services.filter((s) => s.category === category).slice(0, 3).map((s) => s._id),
        requestedServices: [category],
        services_list: serviceLabels[category].map((name, idx) => ({
          service_id: `${category}_${idx + 1}`,
          name,
          price: randomInt(60, 260),
          currency: 'SAR',
          unit: 'خدمة',
        })),
        emergency247: emergency,
        is_emergency: emergency,
        serviceRadiusKm: randomInt(4, 28),
        paymentMethods: ['cash', ...(Math.random() < 0.65 ? ['wallet'] : []), ...(Math.random() < 0.45 ? ['card'] : [])],
        facilities: ['parking', ...(Math.random() < 0.5 ? ['wifi'] : []), ...(Math.random() < 0.4 ? ['waiting_area'] : [])],
        experienceYears: randomInt(2, 22),
        techCount: randomInt(1, 9),
        tags: serviceLabels[category],
        isPhoneVerified: true,
        workingHours: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday'].map((day) => ({
          day,
          open: '08:30',
          close: emergency && Math.random() < 0.5 ? '23:30' : '18:30',
          isClosed: false,
        })).concat([{ day: 'Friday', open: '10:00', close: '16:00', isClosed: Math.random() < 0.35 }]),
        averageRating: 0,
        totalReviews: 0,
        totalOrders: 0,
        documents: [],
        shopPhotos: [],
        commissionRate: randomInt(8, 14),
        lastOnlineAt: status === 'offline' ? dateWithinLastDays(7, true) : now,
        metadata: { generatedBy: GENERATED_BY, runId },
        createdAt,
        updatedAt: createdAt,
      });
    }
    const insertedProviders = await insertMany(db.collection('providers'), providerDocs);
    const newProviders = insertedProviders.insertedIds ? Object.values(insertedProviders.insertedIds) : [];

    await ensureWallets(db, newUsers, 'user', now);
    await ensureWallets(db, newProviders, 'provider', now);

    const userPool = [
      ...existingUsers.map((u) => u._id),
      ...newUsers,
    ];
    const providerPool = [
      ...existingProviders.map((p) => p._id),
      ...newProviders,
    ];
    const providerInfo = new Map(existingProviders.map((p) => [p._id.toString(), p]));
    providerDocs.forEach((p, index) => providerInfo.set(newProviders[index]?.toString(), p));

    const orders = [];
    for (let i = 0; i < batchOptions.orders; i += 1) {
      const createdAt = dateWithinLastDays(batchOptions.days, true);
      const provider = pick(providerPool);
      const providerData = providerInfo.get(provider.toString()) || {};
      const user = pick(userPool);
      const service = pick(services);
      const status = pickWeightedPairs(orderStatuses);
      const totalAmount = randomInt(65, 420);
      const discountAmount = Math.random() < 0.18 ? randomInt(5, Math.min(55, totalAmount - 10)) : 0;
      const payableAmount = totalAmount - discountAmount;
      const paymentMethod = pick(paymentMethods);
      const isCompleted = status === 'completed';
      const isCancelled = status === 'cancelled' || status === 'rejected';
      const acceptedAt = isCompleted || !['pending', 'cancelled', 'rejected'].includes(status) ? addMinutes(createdAt, randomInt(3, 18)) : undefined;
      const startedAt = isCompleted || ['provider_arrived', 'in_progress', 'awaiting_customer_confirmation'].includes(status) ? addMinutes(createdAt, randomInt(18, 48)) : undefined;
      const completedAt = isCompleted ? addMinutes(createdAt, randomInt(45, 145)) : undefined;
      const cancelledAt = isCancelled ? addMinutes(createdAt, randomInt(10, 85)) : undefined;
      const coords = providerData.location?.coordinates || weightedPick(cities).coordinates;
      const rating = isCompleted && Math.random() < 0.58 ? pickWeightedPairs([[5, 0.55], [4, 0.32], [3, 0.10], [2, 0.025], [1, 0.005]]) : 0;

      orders.push({
        orderNumber: orderNumber(createdAt, i),
        user,
        provider,
        service: service._id,
        status,
        totalAmount,
        discountAmount,
        payableAmount,
        location: { type: 'Point', coordinates: jitterCoordinates(coords, 0.05) },
        providerLocation: acceptedAt ? { type: 'Point', coordinates: jitterCoordinates(coords, 0.03) } : undefined,
        providerLocationUpdatedAt: acceptedAt,
        providerLocationHistory: acceptedAt ? [{ coordinates: jitterCoordinates(coords, 0.04), recordedAt: acceptedAt, accuracy: randomInt(8, 35) }] : [],
        address: `${providerData.city || 'دمشق'} - طلب تجريبي محلي`,
        isScheduled: Math.random() < 0.28,
        scheduledAt: Math.random() < 0.28 ? addMinutes(createdAt, randomInt(120, 4320)) : undefined,
        paymentStatus: isCompleted ? 'completed' : isCancelled ? pickWeightedPairs([['refunded', 0.2], ['failed', 0.15], ['pending', 0.65]]) : 'pending',
        paymentMethod,
        paymentId: isCompleted ? `PAY-DEMO-${Date.now()}-${i}` : undefined,
        userNotes: `طلب تجريبي غني للشارتات - ${service.nameAr || service.name}`,
        providerNotes: isCompleted ? 'تمت الخدمة بنجاح ضمن بيانات التطوير المحلية.' : undefined,
        images: [],
        acceptedAt,
        startedAt,
        completedAt,
        completionRequestedAt: status === 'awaiting_customer_confirmation' ? addMinutes(createdAt, 80) : undefined,
        customerConfirmedAt: isCompleted ? completedAt : undefined,
        cancelledAt,
        cancellationReason: isCancelled ? pick(['ازدحام على المزود', 'تغيير موعد العميل', 'طلب مكرر', 'خارج نطاق التغطية']) : undefined,
        cancelledBy: isCancelled ? pick(['user', 'provider', 'system']) : undefined,
        rating,
        metadata: {
          generatedBy: GENERATED_BY,
          runId,
          serviceName: service.nameAr || service.name,
          city: providerData.city,
          governorate: providerData.governorate,
        },
        createdAt,
        updatedAt: completedAt || cancelledAt || acceptedAt || createdAt,
      });
    }
    const insertedOrders = await insertMany(db.collection('orders'), orders);
    const insertedOrderIds = insertedOrders.insertedIds ? Object.values(insertedOrders.insertedIds) : [];

    const completedRatedOrders = orders
      .map((order, index) => ({ ...order, _id: insertedOrderIds[index] }))
      .filter((order) => order._id && order.status === 'completed' && order.rating > 0);

    const reviewCount = Math.min(batchOptions.reviews, completedRatedOrders.length);
    const reviewDocs = completedRatedOrders.slice(0, reviewCount).map((order, index) => {
      const createdAt = addMinutes(order.completedAt || order.createdAt, randomInt(10, 360));
      const rating = order.rating;
      return {
        user: order.user,
        provider: order.provider,
        order: order._id,
        rating,
        comment: pick(reviewComments),
        serviceQuality: Math.max(1, Math.min(5, rating + randomInt(-1, 0))),
        punctuality: Math.max(1, Math.min(5, rating + randomInt(-1, 0))),
        professionalism: rating,
        valueForMoney: Math.max(1, Math.min(5, rating + randomInt(-1, 0))),
        images: [],
        isReported: false,
        isVisible: true,
        isFlagged: false,
        helpfulCount: randomInt(0, 12),
        metadata: { generatedBy: GENERATED_BY, runId },
        createdAt,
        updatedAt: createdAt,
      };
    });
    const insertedReviews = await insertMany(db.collection('reviews'), reviewDocs);

    const wallets = await db.collection('wallets').find({
      ownerId: { $in: providerPool.slice(0, 600) },
      ownerType: 'provider',
    }).toArray();
    const walletByOwner = new Map(wallets.map((wallet) => [wallet.ownerId.toString(), wallet]));
    const transactionDocs = completedRatedOrders.slice(0, Math.min(completedRatedOrders.length, 900)).flatMap((order, index) => {
      const wallet = walletByOwner.get(order.provider.toString());
      if (!wallet) return [];
      const commission = Number((order.payableAmount * 0.12).toFixed(2));
      const payout = Number((order.payableAmount - commission).toFixed(2));
      const balanceBefore = Number((wallet.balance + index * 2.7).toFixed(2));
      const createdAt = order.completedAt || order.createdAt;
      return [{
        transactionNumber: `TRX-DEMO-${createdAt.getTime()}-${index}-${randomInt(100, 999)}`,
        wallet: wallet._id,
        ownerId: order.provider,
        ownerType: 'provider',
        type: 'credit',
        amount: payout,
        balanceBefore,
        balanceAfter: Number((balanceBefore + payout).toFixed(2)),
        description: `إيراد خدمة تجريبية للطلب ${order.orderNumber}`,
        referenceType: 'order',
        referenceId: order._id,
        paymentMethod: order.paymentMethod,
        paymentId: order.paymentId,
        status: 'completed',
        pointsEarned: 0,
        pointsRedeemed: 0,
        metadata: { generatedBy: GENERATED_BY, runId, commission },
        createdAt,
        updatedAt: createdAt,
      }];
    });
    const insertedTransactions = await insertMany(db.collection('transactions'), transactionDocs);

    const touchedProviderIds = Array.from(new Set(orders.map((order) => order.provider.toString()))).map((id) => new ObjectId(id));
    await refreshProviderSummaries(db, touchedProviderIds);

    const summary = {
      runId,
      users: newUsers.length,
      providers: newProviders.length,
      orders: insertedOrderIds.length,
      reviews: insertedReviews.insertedCount || reviewDocs.length,
      transactions: insertedTransactions.insertedCount || transactionDocs.length,
      touchedProviders: touchedProviderIds.length,
    };
    console.log(JSON.stringify(summary, null, 2));
    return summary;
  } finally {
    await client.close();
  }
}

async function refreshProviderSummaries(db, providerIds) {
  const orders = db.collection('orders');
  const reviews = db.collection('reviews');
  const providers = db.collection('providers');
  const metrics = db.collection('provider_metrics');

  const orderStats = await orders.aggregate([
    { $match: { provider: { $in: providerIds } } },
    {
      $group: {
        _id: '$provider',
        totalOrders: { $sum: 1 },
        completedOrders: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        cancelledOrders: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        failedOrders: { $sum: { $cond: [{ $in: ['$status', ['rejected']] }, 1, 0] } },
        totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$payableAmount', 0] } },
        avgResponseMinutes: {
          $avg: {
            $cond: [
              { $and: [{ $ne: ['$acceptedAt', null] }, { $ne: ['$createdAt', null] }] },
              { $divide: [{ $subtract: ['$acceptedAt', '$createdAt'] }, 60000] },
              null,
            ],
          },
        },
      },
    },
  ]).toArray();

  const reviewStats = await reviews.aggregate([
    { $match: { provider: { $in: providerIds }, isVisible: { $ne: false } } },
    {
      $group: {
        _id: '$provider',
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
      },
    },
  ]).toArray();

  const reviewsByProvider = new Map(reviewStats.map((stat) => [stat._id.toString(), stat]));

  await Promise.all(orderStats.map(async (stat) => {
    const review = reviewsByProvider.get(stat._id.toString()) || {};
    const totalOrders = stat.totalOrders || 0;
    const completionRate = totalOrders ? stat.completedOrders / totalOrders : 0;
    const cancellationRate = totalOrders ? stat.cancelledOrders / totalOrders : 0;
    const averageRating = Number((review.averageRating || 0).toFixed(2));
    const totalReviews = review.totalReviews || 0;
    const now = new Date();

    await providers.updateOne(
      { _id: stat._id },
      {
        $set: {
          totalOrders,
          totalReviews,
          averageRating,
          updatedAt: now,
          'metadata.cancellationRate': Number(cancellationRate.toFixed(3)),
        },
      },
    );

    await metrics.updateOne(
      { provider: stat._id },
      {
        $set: {
          provider: stat._id,
          totalOrders,
          completedOrders: stat.completedOrders || 0,
          cancelledOrders: stat.cancelledOrders || 0,
          failedOrders: stat.failedOrders || 0,
          completionRate: Number(completionRate.toFixed(3)),
          cancellationRate: Number(cancellationRate.toFixed(3)),
          averageRating,
          totalReviews,
          averageResponseTime: Number((stat.avgResponseMinutes || randomInt(9, 22)).toFixed(1)),
          totalRevenue: Number((stat.totalRevenue || 0).toFixed(2)),
          recentPerformance: {
            totalOrders: Math.min(totalOrders, randomInt(18, 95)),
            completionRate: Number(Math.max(0.62, Math.min(0.96, completionRate || 0.78)).toFixed(3)),
            averageRating,
          },
          peakHourPerformance: {
            totalOrders: Math.min(totalOrders, randomInt(8, 45)),
            completionRate: Number(Math.max(0.58, Math.min(0.94, completionRate || 0.76)).toFixed(3)),
            averageRating,
          },
          serviceSpecializationScores: {},
          cityPerformance: {},
          metadata: { generatedBy: GENERATED_BY },
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );
  }));
}

(async () => {
  if (!options.watch) {
    await seedOnce(options);
    return;
  }

  console.log(`Starting local demo activity cron every ${options.intervalMinutes} minutes.`);
  const cronBatch = {
    days: 3,
    providers: 0,
    users: Math.max(3, Math.min(20, Math.round(options.users * 0.025))),
    orders: Math.max(12, Math.min(80, Math.round(options.orders * 0.025))),
    reviews: Math.max(4, Math.min(30, Math.round(options.reviews * 0.02))),
  };

  await seedOnce(cronBatch);
  setInterval(() => {
    seedOnce(cronBatch).catch((err) => console.error(err));
  }, options.intervalMinutes * 60 * 1000);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
