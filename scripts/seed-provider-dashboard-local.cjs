const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/car_hero_provider_local';
const password = process.env.PROVIDER_TEST_PASSWORD || 'Provider@12345';
const providerPhone = process.env.PROVIDER_TEST_PHONE || '+963933111111';

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dayMs = 24 * 60 * 60 * 1000;
const now = new Date();
const date = (daysOffset, hour = 9) => {
  const value = new Date(now.getTime() + daysOffset * dayMs);
  value.setHours(hour, 0, 0, 0);
  return value;
};

function serviceDoc(_id, name, nameAr, category, basePrice, duration, isEmergency = false, sortOrder = 0) {
  return {
    _id,
    name,
    nameAr,
    description: `${name} service for provider dashboard testing`,
    descriptionAr: `خدمة ${nameAr} لاختبار لوحة المزود`,
    category,
    basePrice,
    discountedPrice: Math.round(basePrice * 0.9),
    estimatedDuration: duration,
    isEmergency,
    isActive: true,
    isSystemService: true,
    sortOrder,
    metadata: { seededFor: 'provider-dashboard-local' },
    createdAt: now,
    updatedAt: now,
  };
}

function orderDoc({
  _id,
  orderNumber,
  user,
  provider,
  service,
  vehicle,
  status,
  amount,
  createdAt,
  scheduledAt,
  paymentStatus = 'completed',
  paymentMethod = 'cash',
  address = 'دمشق - المزة - شارع الاختبار',
  userNotes = 'الرجاء التواصل قبل الوصول.',
  cancellationReason,
  cancelledBy,
}) {
  return {
    _id,
    orderNumber,
    user,
    provider,
    service,
    vehicle,
    status,
    totalAmount: amount,
    discountAmount: 0,
    payableAmount: amount,
    location: { type: 'Point', coordinates: [36.2765, 33.5138] },
    providerLocation: { type: 'Point', coordinates: [36.285, 33.507] },
    providerLocationUpdatedAt: createdAt,
    providerLocationHistory: [
      { coordinates: [36.28, 33.51], recordedAt: createdAt, accuracy: 8 },
      { coordinates: [36.285, 33.507], recordedAt: new Date(createdAt.getTime() + 10 * 60 * 1000), accuracy: 6 },
    ],
    address,
    isScheduled: Boolean(scheduledAt),
    scheduledAt,
    paymentStatus,
    paymentMethod,
    userNotes,
    images: [],
    acceptedAt: ['accepted', 'provider_en_route', 'provider_arrived', 'in_progress', 'completed'].includes(status) ? new Date(createdAt.getTime() + 12 * 60 * 1000) : undefined,
    startedAt: ['in_progress', 'completed'].includes(status) ? new Date(createdAt.getTime() + 35 * 60 * 1000) : undefined,
    completedAt: status === 'completed' ? new Date(createdAt.getTime() + 85 * 60 * 1000) : undefined,
    cancelledAt: ['cancelled', 'rejected'].includes(status) ? new Date(createdAt.getTime() + 25 * 60 * 1000) : undefined,
    cancellationReason,
    cancelledBy,
    rating: status === 'completed' ? 5 : 0,
    metadata: { seededFor: 'provider-dashboard-local' },
    createdAt,
    updatedAt: createdAt,
  };
}

function transactionDoc({
  _id,
  wallet,
  ownerId,
  type,
  amount,
  before,
  after,
  description,
  referenceType,
  referenceId,
  status = 'completed',
  paymentMethod = 'cash',
  createdAt,
  metadata = {},
}) {
  return {
    _id,
    transactionNumber: `TX-PROV-${createdAt.getTime()}-${String(amount).slice(0, 3)}`,
    wallet,
    ownerId,
    ownerType: 'provider',
    type,
    amount,
    balanceBefore: before,
    balanceAfter: after,
    description,
    referenceType,
    referenceId,
    paymentMethod,
    status,
    pointsEarned: 0,
    pointsRedeemed: 0,
    metadata: { seededFor: 'provider-dashboard-local', ...metadata },
    createdAt,
    updatedAt: createdAt,
  };
}

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  const providerUserId = new ObjectId('665000000000000000000001');
  const providerId = new ObjectId('665000000000000000000101');
  const customerIds = [
    new ObjectId('665000000000000000000201'),
    new ObjectId('665000000000000000000202'),
    new ObjectId('665000000000000000000203'),
    new ObjectId('665000000000000000000204'),
  ];
  const serviceIds = [
    new ObjectId('665000000000000000000301'),
    new ObjectId('665000000000000000000302'),
    new ObjectId('665000000000000000000303'),
    new ObjectId('665000000000000000000304'),
    new ObjectId('665000000000000000000305'),
  ];
  const vehicleIds = [
    new ObjectId('665000000000000000000401'),
    new ObjectId('665000000000000000000402'),
    new ObjectId('665000000000000000000403'),
    new ObjectId('665000000000000000000404'),
  ];
  const orderIds = [
    new ObjectId('665000000000000000000501'),
    new ObjectId('665000000000000000000502'),
    new ObjectId('665000000000000000000503'),
    new ObjectId('665000000000000000000504'),
    new ObjectId('665000000000000000000505'),
    new ObjectId('665000000000000000000506'),
    new ObjectId('665000000000000000000507'),
    new ObjectId('665000000000000000000508'),
    new ObjectId('665000000000000000000509'),
    new ObjectId('665000000000000000000510'),
    new ObjectId('665000000000000000000511'),
    new ObjectId('665000000000000000000512'),
    new ObjectId('665000000000000000000513'),
    new ObjectId('665000000000000000000514'),
  ];
  const walletId = new ObjectId('665000000000000000000601');

  await Promise.all([
    db.collection('users').deleteMany({ $or: [{ phoneNumber: providerPhone }, { metadata: { seededFor: 'provider-dashboard-local' } }] }),
    db.collection('providers').deleteMany({ $or: [{ phone: providerPhone }, { 'metadata.seededFor': 'provider-dashboard-local' }] }),
    db.collection('services').deleteMany({ 'metadata.seededFor': 'provider-dashboard-local' }),
    db.collection('vehicles').deleteMany({ 'metadata.seededFor': 'provider-dashboard-local' }),
    db.collection('orders').deleteMany({ 'metadata.seededFor': 'provider-dashboard-local' }),
    db.collection('wallets').deleteMany({ 'metadata.seededFor': 'provider-dashboard-local' }),
    db.collection('transactions').deleteMany({ 'metadata.seededFor': 'provider-dashboard-local' }),
    db.collection('settings').deleteMany({ key: { $in: ['min_withdrawal_amount'] } }),
  ]);

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.collection('users').insertMany([
    {
      _id: providerUserId,
      fullName: 'Provider Owner Local',
      phoneNumber: providerPhone,
      password: hashedPassword,
      profileImage: null,
      accountType: 'provider',
      role: 'provider',
      loyaltyLevel: 1,
      isPremium: false,
      premiumExpiresAt: null,
      preferences: { language: 'ar', notifications: { push: true, sms: true, email: false } },
      isActive: true,
      isTermsAccepted: true,
      isVerified: true,
      lastLoginAt: null,
      refreshToken: null,
      vehicles: [],
      metadata: { seededFor: 'provider-dashboard-local' },
      createdAt: date(-45),
      updatedAt: now,
    },
    ...customerIds.map((id, index) => ({
      _id: id,
      fullName: ['أحمد المحلي', 'سارة الاختبار', 'محمود دمشق', 'ليلى المزّة'][index],
      phoneNumber: `+96394400000${index + 1}`,
      password: hashedPassword,
      profileImage: null,
      accountType: 'customer',
      role: 'user',
      loyaltyLevel: index + 1,
      isPremium: index % 2 === 0,
      premiumExpiresAt: null,
      preferences: { language: 'ar', notifications: { push: true, sms: true, email: false } },
      isActive: true,
      isTermsAccepted: true,
      isVerified: true,
      lastLoginAt: date(-index - 1),
      refreshToken: null,
      vehicles: [vehicleIds[index]],
      metadata: { seededFor: 'provider-dashboard-local' },
      createdAt: date(-35 + index),
      updatedAt: now,
    })),
  ]);

  await db.collection('services').insertMany([
    serviceDoc(serviceIds[0], 'Towing', 'سحب سيارة', 'towing', 80000, 35, true, 1),
    serviceDoc(serviceIds[1], 'Battery jumpstart', 'اشتراك بطارية', 'battery', 50000, 20, true, 2),
    serviceDoc(serviceIds[2], 'Tire replacement', 'تبديل إطار', 'tire', 40000, 25, false, 3),
    serviceDoc(serviceIds[3], 'Fuel delivery', 'توصيل وقود', 'fuel', 30000, 30, false, 4),
    serviceDoc(serviceIds[4], 'Car wash', 'غسيل سيارة', 'car_wash', 45000, 45, false, 5),
  ]);

  await db.collection('providers').insertOne({
    _id: providerId,
    phone: providerPhone,
    email: 'provider.local@carhero.test',
    businessName: 'CarHero Local Provider',
    ownerName: 'Provider Owner Local',
    description: 'مزود محلي لاختبار لوحة تحكم المزود وكل الإجراءات.',
    businessType: 'workshop',
    category: 'towing',
    logo: '/logo_carHero.png',
    images: [],
    role: 'provider',
    status: 'online',
    accountStatus: 'active',
    accountType: 'provider',
    registrationStatus: 'approved',
    isApproved: true,
    isActive: true,
    location: { type: 'Point', coordinates: [36.2765, 33.5138] },
    address: 'دمشق - المزة - شارع الاختبار',
    city: 'دمشق',
    governorate: 'دمشق',
    country: 'Syria',
    coverageAreas: ['دمشق', 'ريف دمشق', 'المزة'],
    serviceCategories: ['towing', 'battery', 'tire'],
    services: [serviceIds[0], serviceIds[1], serviceIds[2]],
    requestedServices: [],
    services_list: [
      { id: serviceIds[0].toString(), nameAr: 'سحب سيارة' },
      { id: serviceIds[1].toString(), nameAr: 'اشتراك بطارية' },
      { id: serviceIds[2].toString(), nameAr: 'تبديل إطار' },
    ],
    servicePrices: {
      [serviceIds[0].toString()]: 76000,
      [serviceIds[1].toString()]: 48000,
      [serviceIds[2].toString()]: 38000,
    },
    serviceAvailability: {
      [serviceIds[0].toString()]: true,
      [serviceIds[1].toString()]: true,
      [serviceIds[2].toString()]: false,
    },
    emergency247: true,
    is_emergency: true,
    serviceRadiusKm: 25,
    paymentMethods: ['cash', 'wallet', 'card'],
    facilities: ['mobile_service', 'workshop'],
    experienceYears: 8,
    techCount: 4,
    tags: ['local-seed', 'provider-dashboard'],
    isPhoneVerified: true,
    workingHours: days.map((day) => ({ day, open: '08:00', close: '18:00', isClosed: day === 'Friday' })),
    averageRating: 4.8,
    totalReviews: 32,
    totalOrders: 14,
    documents: ['/uploads/provider-documents/local-license.pdf'],
    shopPhotos: [],
    bankAccount: {
      bankName: 'بنك الاختبار المحلي',
      accountNumber: '000123456789',
      iban: 'SY000000123456789',
      accountHolderName: 'Provider Owner Local',
    },
    commissionRate: 10,
    lastOnlineAt: now,
    metadata: { seededFor: 'provider-dashboard-local' },
    createdAt: date(-40),
    updatedAt: now,
  });

  await db.collection('vehicles').insertMany(vehicleIds.map((id, index) => ({
    _id: id,
    owner: customerIds[index],
    brand: ['Toyota', 'Kia', 'Hyundai', 'BMW'][index],
    model: ['Corolla', 'Rio', 'Tucson', 'X3'][index],
    year: 2018 + index,
    plateNumber: `دمشق-${12340 + index}`,
    color: ['أبيض', 'أسود', 'فضي', 'أزرق'][index],
    isActive: true,
    isDefault: true,
    metadata: { seededFor: 'provider-dashboard-local' },
    createdAt: date(-20 + index),
    updatedAt: now,
  })));

  const orderRows = [
    orderDoc({ _id: orderIds[0], orderNumber: 'CH-LOCAL-001', user: customerIds[0], provider: providerId, service: serviceIds[0], vehicle: vehicleIds[0], status: 'pending', amount: 76000, createdAt: date(-0.2, 10), paymentStatus: 'pending', paymentMethod: 'cash' }),
    orderDoc({ _id: orderIds[1], orderNumber: 'CH-LOCAL-002', user: customerIds[1], provider: providerId, service: serviceIds[1], vehicle: vehicleIds[1], status: 'accepted', amount: 48000, createdAt: date(-0.7, 11), paymentStatus: 'completed', paymentMethod: 'wallet' }),
    orderDoc({ _id: orderIds[2], orderNumber: 'CH-LOCAL-003', user: customerIds[2], provider: providerId, service: serviceIds[2], vehicle: vehicleIds[2], status: 'in_progress', amount: 38000, createdAt: date(-1, 14), paymentStatus: 'completed', paymentMethod: 'card' }),
    orderDoc({ _id: orderIds[3], orderNumber: 'CH-LOCAL-004', user: customerIds[3], provider: providerId, service: serviceIds[3], vehicle: vehicleIds[3], status: 'provider_en_route', amount: 29000, createdAt: date(-1.2, 16), paymentStatus: 'completed', paymentMethod: 'cash' }),
    orderDoc({ _id: orderIds[4], orderNumber: 'CH-LOCAL-005', user: customerIds[0], provider: providerId, service: serviceIds[4], vehicle: vehicleIds[0], status: 'completed', amount: 52000, createdAt: date(-3, 15), scheduledAt: date(1, 12), paymentStatus: 'completed', paymentMethod: 'cash' }),
    orderDoc({ _id: orderIds[5], orderNumber: 'CH-LOCAL-006', user: customerIds[1], provider: providerId, service: serviceIds[0], vehicle: vehicleIds[1], status: 'cancelled', amount: 80000, createdAt: date(-4, 9), paymentStatus: 'refunded', paymentMethod: 'card', cancellationReason: 'العميل ألغى الطلب قبل الوصول', cancelledBy: 'user' }),
    orderDoc({ _id: orderIds[6], orderNumber: 'CH-LOCAL-007', user: customerIds[2], provider: providerId, service: serviceIds[1], vehicle: vehicleIds[2], status: 'rejected', amount: 50000, createdAt: date(-5, 12), paymentStatus: 'pending', paymentMethod: 'cash', cancellationReason: 'المزود غير متاح في هذا الوقت', cancelledBy: 'provider' }),
    orderDoc({ _id: orderIds[7], orderNumber: 'CH-LOCAL-008', user: customerIds[3], provider: providerId, service: serviceIds[2], vehicle: vehicleIds[3], status: 'accepted', amount: 39000, createdAt: date(-0.4, 13), scheduledAt: date(2, 17), paymentStatus: 'completed', paymentMethod: 'wallet' }),
    orderDoc({ _id: orderIds[8], orderNumber: 'CH-LOCAL-009', user: customerIds[0], provider: providerId, service: serviceIds[0], vehicle: vehicleIds[0], status: 'pending', amount: 81000, createdAt: date(-0.15, 15), paymentStatus: 'pending', paymentMethod: 'cash', address: 'دمشق - المالكي - طلب صفحة ثانية' }),
    orderDoc({ _id: orderIds[9], orderNumber: 'CH-LOCAL-010', user: customerIds[1], provider: providerId, service: serviceIds[1], vehicle: vehicleIds[1], status: 'accepted', amount: 51000, createdAt: date(-0.25, 16), paymentStatus: 'completed', paymentMethod: 'wallet' }),
    orderDoc({ _id: orderIds[10], orderNumber: 'CH-LOCAL-011', user: customerIds[2], provider: providerId, service: serviceIds[2], vehicle: vehicleIds[2], status: 'provider_arrived', amount: 41000, createdAt: date(-0.35, 17), paymentStatus: 'completed', paymentMethod: 'card' }),
    orderDoc({ _id: orderIds[11], orderNumber: 'CH-LOCAL-012', user: customerIds[3], provider: providerId, service: serviceIds[3], vehicle: vehicleIds[3], status: 'provider_assigned', amount: 31000, createdAt: date(-0.45, 18), paymentStatus: 'completed', paymentMethod: 'cash' }),
    orderDoc({ _id: orderIds[12], orderNumber: 'CH-LOCAL-013', user: customerIds[0], provider: providerId, service: serviceIds[4], vehicle: vehicleIds[0], status: 'in_progress', amount: 55000, createdAt: date(-0.55, 19), paymentStatus: 'completed', paymentMethod: 'wallet' }),
    orderDoc({ _id: orderIds[13], orderNumber: 'CH-LOCAL-014', user: customerIds[1], provider: providerId, service: serviceIds[0], vehicle: vehicleIds[1], status: 'pending', amount: 84000, createdAt: date(-0.65, 20), scheduledAt: date(3, 10), paymentStatus: 'pending', paymentMethod: 'cash' }),
  ];
  await db.collection('orders').insertMany(orderRows);

  await db.collection('wallets').insertOne({
    _id: walletId,
    ownerId: providerId,
    ownerType: 'provider',
    balance: 250000,
    pendingBalance: 25000,
    loyaltyPoints: 0,
    currency: 'SYP',
    isActive: true,
    metadata: { seededFor: 'provider-dashboard-local' },
    createdAt: date(-30),
    updatedAt: now,
  });

  await db.collection('transactions').insertMany([
    transactionDoc({ _id: new ObjectId('665000000000000000000701'), wallet: walletId, ownerId: providerId, type: 'credit', amount: 52000, before: 150000, after: 202000, description: 'أرباح طلب مكتمل CH-LOCAL-005', referenceType: 'order', referenceId: orderIds[4], createdAt: date(-3, 17) }),
    transactionDoc({ _id: new ObjectId('665000000000000000000702'), wallet: walletId, ownerId: providerId, type: 'credit', amount: 76000, before: 74000, after: 150000, description: 'رصيد افتتاحي أرباح طلب محلي', referenceType: 'order', referenceId: orderIds[0], createdAt: date(-2, 12) }),
    transactionDoc({ _id: new ObjectId('665000000000000000000703'), wallet: walletId, ownerId: providerId, type: 'debit', amount: 50000, before: 300000, after: 250000, description: 'سحب مكتمل إلى بنك الاختبار', referenceType: 'payout', status: 'completed', paymentMethod: 'bank_transfer', createdAt: date(-6, 10), metadata: { bankName: 'بنك الاختبار', bankAccount: 'SY123456789' } }),
    transactionDoc({ _id: new ObjectId('665000000000000000000704'), wallet: walletId, ownerId: providerId, type: 'debit', amount: 25000, before: 275000, after: 250000, description: 'طلب سحب قيد المراجعة', referenceType: 'payout', status: 'pending', paymentMethod: 'bank_transfer', createdAt: date(-1, 16), metadata: { bankName: 'بنك الاختبار', bankAccount: 'SY987654321' } }),
    transactionDoc({ _id: new ObjectId('665000000000000000000705'), wallet: walletId, ownerId: providerId, type: 'refund', amount: 10000, before: 250000, after: 260000, description: 'تسوية محفظة محلية', referenceType: 'adjustment', status: 'completed', paymentMethod: 'system', createdAt: date(-8, 11) }),
    transactionDoc({ _id: new ObjectId('665000000000000000000706'), wallet: walletId, ownerId: providerId, type: 'credit', amount: 48000, before: 260000, after: 308000, description: 'أرباح طلب CH-LOCAL-002', referenceType: 'order', referenceId: orderIds[1], createdAt: date(-0.9, 12) }),
    transactionDoc({ _id: new ObjectId('665000000000000000000707'), wallet: walletId, ownerId: providerId, type: 'credit', amount: 38000, before: 308000, after: 346000, description: 'أرباح طلب CH-LOCAL-003', referenceType: 'order', referenceId: orderIds[2], createdAt: date(-0.8, 13) }),
    transactionDoc({ _id: new ObjectId('665000000000000000000708'), wallet: walletId, ownerId: providerId, type: 'credit', amount: 39000, before: 346000, after: 385000, description: 'أرباح طلب مجدول CH-LOCAL-008', referenceType: 'order', referenceId: orderIds[7], createdAt: date(-0.7, 14) }),
    transactionDoc({ _id: new ObjectId('665000000000000000000709'), wallet: walletId, ownerId: providerId, type: 'debit', amount: 30000, before: 385000, after: 355000, description: 'طلب سحب صغير للاختبار', referenceType: 'payout', status: 'pending', paymentMethod: 'bank_transfer', createdAt: date(-0.6, 15), metadata: { bankName: 'بنك التجارب', bankAccount: 'SY000111222' } }),
    transactionDoc({ _id: new ObjectId('665000000000000000000710'), wallet: walletId, ownerId: providerId, type: 'credit', amount: 29000, before: 355000, after: 384000, description: 'أرباح طلب طريق CH-LOCAL-004', referenceType: 'order', referenceId: orderIds[3], createdAt: date(-0.5, 16) }),
    transactionDoc({ _id: new ObjectId('665000000000000000000711'), wallet: walletId, ownerId: providerId, type: 'refund', amount: 5000, before: 384000, after: 389000, description: 'تسوية عمولة تجريبية', referenceType: 'adjustment', status: 'completed', paymentMethod: 'system', createdAt: date(-0.4, 17) }),
    transactionDoc({ _id: new ObjectId('665000000000000000000712'), wallet: walletId, ownerId: providerId, type: 'credit', amount: 81000, before: 389000, after: 470000, description: 'أرباح معلقة لطلب CH-LOCAL-009', referenceType: 'order', referenceId: orderIds[8], status: 'pending', createdAt: date(-0.3, 18) }),
    transactionDoc({ _id: new ObjectId('665000000000000000000713'), wallet: walletId, ownerId: providerId, type: 'credit', amount: 51000, before: 470000, after: 521000, description: 'أرباح طلب CH-LOCAL-010', referenceType: 'order', referenceId: orderIds[9], createdAt: date(-0.2, 19) }),
  ]);

  await db.collection('settings').insertOne({
    key: 'min_withdrawal_amount',
    value: 50000,
    description: 'Minimum provider payout amount for local dashboard testing',
    group: 'wallet',
    isPublic: false,
    maintenanceMode: false,
    metadata: { seededFor: 'provider-dashboard-local' },
    createdAt: now,
    updatedAt: now,
  });

  await client.close();
  console.log(JSON.stringify({
    ok: true,
    database: uri.replace(/\/\/.*@/, '//<credentials>@'),
    providerPhone,
    providerPassword: password,
    providerId: providerId.toString(),
    orders: orderRows.length,
    services: serviceIds.length,
    note: 'Use this account only for local provider dashboard integration testing.',
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
