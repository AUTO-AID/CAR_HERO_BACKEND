const { MongoClient, ObjectId } = require('mongodb');

async function seed() {
  const client = await MongoClient.connect('mongodb://127.0.0.1:27017/car_hero');
  const db = client.db('car_hero');

  // Fetch real user IDs for integration
  const users = await db.collection('users').find({ accountType: 'customer' }).limit(20).toArray();
  const vehicles = await db.collection('vehicles').find({}).limit(20).toArray();
  const orders = await db.collection('orders').find({}).limit(10).toArray();

  if (users.length === 0) { console.log('ERROR: No users found!'); process.exit(1); }

  const userIds = users.map(u => u._id);
  const vehicleIds = vehicles.map(v => v._id);

  console.log('Using ' + userIds.length + ' users, ' + vehicleIds.length + ' vehicles\n');

  // ============================================================
  // 1. SEED user_addresses
  // ============================================================
  const addresses = [
    // Damascus addresses
    { userId: userIds[0], label: 'المنزل', addressLine: 'دمشق - مشروع دمر - بناء 12 طابق 3', note: 'بجانب صيدلية الحياة', location: { type: 'Point', coordinates: [36.2521, 33.5271] }, isDefault: true },
    { userId: userIds[0], label: 'العمل', addressLine: 'دمشق - شارع الثورة - برج الأعمال', note: 'الطابق 8 - مكتب 803', location: { type: 'Point', coordinates: [36.2915, 33.5138] }, isDefault: false },
    { userId: userIds[0], label: 'بيت العائلة', addressLine: 'دمشق - المزة - فيلات شرقية', note: 'فيلا رقم 45', location: { type: 'Point', coordinates: [36.2654, 33.5022] }, isDefault: false },
    { userId: userIds[1], label: 'المنزل', addressLine: 'دمشق - المالكي - شارع أبو رمانة', note: 'بناء الياسمين - طابق 5', location: { type: 'Point', coordinates: [36.2812, 33.5165] }, isDefault: true },
    { userId: userIds[1], label: 'الشركة', addressLine: 'دمشق - البرامكة - مجمع يلبغا', note: 'الجناح B الطابق 2', location: { type: 'Point', coordinates: [36.3045, 33.5123] }, isDefault: false },
    { userId: userIds[2], label: 'المنزل', addressLine: 'ريف دمشق - جرمانا - شارع الربيع', note: 'بجانب مركز الأمل التجاري', location: { type: 'Point', coordinates: [36.3352, 33.4867] }, isDefault: true },
    { userId: userIds[2], label: 'الجامعة', addressLine: 'دمشق - المزة 86 - جامعة دمشق', note: 'كلية الهندسة المدنية', location: { type: 'Point', coordinates: [36.2756, 33.5098] }, isDefault: false },
    { userId: userIds[3], label: 'البيت', addressLine: 'دمشق - كفرسوسة - شارع الزهور', note: 'مقابل مطعم الريف', location: { type: 'Point', coordinates: [36.2678, 33.4978] }, isDefault: true },
    { userId: userIds[3], label: 'المحل', addressLine: 'دمشق - باب توما - سوق الحميدية', note: 'محل رقم 34', location: { type: 'Point', coordinates: [36.3112, 33.5132] }, isDefault: false },
    { userId: userIds[3], label: 'الكراج', addressLine: 'دمشق - عدرا الصناعية - بلوك C', note: 'كراج الأمل للسيارات', location: { type: 'Point', coordinates: [36.4523, 33.5345] }, isDefault: false },
    // More users
    { userId: userIds[4] || userIds[0], label: 'المنزل', addressLine: 'حلب - الشهباء - حي الأشرفية', note: 'بناء 7 طابق أرضي', location: { type: 'Point', coordinates: [37.1612, 36.2029] }, isDefault: true },
    { userId: userIds[4] || userIds[0], label: 'المكتب', addressLine: 'حلب - العزيزية - شارع النصر', note: 'مكتب المحاماة', location: { type: 'Point', coordinates: [37.1545, 36.2102] }, isDefault: false },
    { userId: userIds[5] || userIds[1], label: 'المنزل', addressLine: 'حمص - الوعر - الحي الأول', note: 'بناء الحرية طابق 4', location: { type: 'Point', coordinates: [36.7189, 34.7278] }, isDefault: true },
    { userId: userIds[6] || userIds[2], label: 'المنزل', addressLine: 'اللاذقية - الزراعة - شارع الكورنيش', note: 'برج البحر طابق 10', location: { type: 'Point', coordinates: [35.7836, 35.5317] }, isDefault: true },
    { userId: userIds[7] || userIds[3], label: 'المنزل', addressLine: 'طرطوس - المشتل - شارع الجلاء', note: 'بناء الياسمين', location: { type: 'Point', coordinates: [35.8867, 34.8940] }, isDefault: true },
  ];

  // Add timestamps
  const now = new Date();
  addresses.forEach(a => { a.createdAt = now; a.updatedAt = now; });

  await db.collection('user_addresses').deleteMany({});
  const addrResult = await db.collection('user_addresses').insertMany(addresses);
  console.log('✅ user_addresses: Inserted ' + addrResult.insertedCount + ' documents');

  // Create 2dsphere index
  try {
    await db.collection('user_addresses').createIndex({ location: '2dsphere' });
  } catch(e) { /* already exists */ }

  const addressIds = Object.values(addrResult.insertedIds);

  // ============================================================
  // 2. SEED user_payment_methods
  // ============================================================
  const paymentMethods = [
    // User 0 - multiple payment methods
    { userId: userIds[0], type: 'card', displayName: 'فيزا تنتهي بـ 4532', last4: '4532', brand: 'visa', providerToken: 'tok_visa_prod_4532_cust0', isDefault: true },
    { userId: userIds[0], type: 'card', displayName: 'ماستركارد تنتهي بـ 8901', last4: '8901', brand: 'mastercard', providerToken: 'tok_mc_prod_8901_cust0', isDefault: false },
    { userId: userIds[0], type: 'wallet', displayName: 'محفظة Car Hero', last4: null, brand: null, providerToken: null, isDefault: false },
    { userId: userIds[0], type: 'cash', displayName: 'الدفع نقداً', last4: null, brand: null, providerToken: null, isDefault: false },
    // User 1
    { userId: userIds[1], type: 'card', displayName: 'فيزا ذهبية 7654', last4: '7654', brand: 'visa', providerToken: 'tok_visa_gold_7654_cust1', isDefault: true },
    { userId: userIds[1], type: 'cash', displayName: 'كاش عند الاستلام', last4: null, brand: null, providerToken: null, isDefault: false },
    // User 2
    { userId: userIds[2], type: 'card', displayName: 'أمريكان إكسبريس 3456', last4: '3456', brand: 'amex', providerToken: 'tok_amex_plat_3456_cust2', isDefault: true },
    { userId: userIds[2], type: 'wallet', displayName: 'رصيد المحفظة', last4: null, brand: null, providerToken: null, isDefault: false },
    // User 3
    { userId: userIds[3], type: 'card', displayName: 'فيزا كلاسيك 1122', last4: '1122', brand: 'visa', providerToken: 'tok_visa_cls_1122_cust3', isDefault: true },
    { userId: userIds[3], type: 'card', displayName: 'ماستركارد بلاتينيوم 9988', last4: '9988', brand: 'mastercard', providerToken: 'tok_mc_plat_9988_cust3', isDefault: false },
    // User 4
    { userId: userIds[4] || userIds[0], type: 'card', displayName: 'فيزا 5566', last4: '5566', brand: 'visa', providerToken: 'tok_visa_5566_cust4', isDefault: true },
    { userId: userIds[5] || userIds[1], type: 'cash', displayName: 'نقداً', last4: null, brand: null, providerToken: null, isDefault: true },
    { userId: userIds[6] || userIds[2], type: 'card', displayName: 'ماستركارد 7788', last4: '7788', brand: 'mastercard', providerToken: 'tok_mc_7788_cust6', isDefault: true },
  ];

  paymentMethods.forEach(p => { p.createdAt = now; p.updatedAt = now; });

  await db.collection('user_payment_methods').deleteMany({});
  const pmResult = await db.collection('user_payment_methods').insertMany(paymentMethods);
  console.log('✅ user_payment_methods: Inserted ' + pmResult.insertedCount + ' documents');

  const paymentMethodIds = Object.values(pmResult.insertedIds);

  // ============================================================
  // 3. SEED offers
  // ============================================================
  const tomorrow = new Date(now.getTime() + 86400000);
  const nextWeek = new Date(now.getTime() + 7 * 86400000);
  const nextMonth = new Date(now.getTime() + 30 * 86400000);
  const yesterday = new Date(now.getTime() - 86400000);
  const lastWeek = new Date(now.getTime() - 7 * 86400000);

  const offers = [
    // Active percentage discounts
    { code: 'WELCOME20', title: 'خصم ترحيبي 20%', description: 'خصم 20% على أول خدمة لك مع كار هيرو! استمتع بتجربتك الأولى بسعر مخفض.', type: 'percentage', value: 20, startsAt: lastWeek, expiresAt: nextMonth, isActive: true, metadata: { maxDiscount: 500, minOrderValue: 100, usageLimit: 1000, usedCount: 234, targetAudience: 'new_customers' } },
    { code: 'SUMMER25', title: 'خصم الصيف 25%', description: 'عرض صيفي حصري! خصم 25% على جميع خدمات غسيل السيارات.', type: 'percentage', value: 25, startsAt: now, expiresAt: nextMonth, isActive: true, metadata: { maxDiscount: 750, minOrderValue: 200, categories: ['car_wash'], usageLimit: 500, usedCount: 89 } },
    { code: 'VIP15', title: 'خصم VIP 15%', description: 'خصم حصري لعملاء الاشتراكات. 15% على أي خدمة.', type: 'percentage', value: 15, startsAt: lastWeek, expiresAt: nextWeek, isActive: true, metadata: { subscribersOnly: true, usageLimit: 200, usedCount: 45 } },
    // Active fixed amount discounts
    { code: 'FLAT100', title: 'خصم 100 ل.س ثابت', description: 'خصم ثابت 100 ليرة سورية على طلبك القادم.', type: 'fixed', value: 100, startsAt: now, expiresAt: nextMonth, isActive: true, metadata: { minOrderValue: 300, usageLimit: 2000, usedCount: 567 } },
    { code: 'SAVE200', title: 'وفّر 200 ل.س', description: 'اطلب أي خدمة سحب ووفر 200 ليرة فوراً.', type: 'fixed', value: 200, startsAt: lastWeek, expiresAt: nextWeek, isActive: true, metadata: { minOrderValue: 500, categories: ['towing'], usageLimit: 300, usedCount: 112 } },
    // Points multiplier
    { code: 'DOUBLE_POINTS', title: 'نقاط مضاعفة', description: 'احصل على ضعف نقاط الولاء عند استخدام هذا الكود!', type: 'points_multiplier', value: 2, startsAt: now, expiresAt: nextWeek, isActive: true, metadata: { usageLimit: 1000, usedCount: 203 } },
    { code: 'TRIPLE_PTS', title: 'نقاط ثلاثية', description: '3 أضعاف نقاط الولاء لعملاء Gold فقط.', type: 'points_multiplier', value: 3, startsAt: now, expiresAt: nextMonth, isActive: true, metadata: { goldOnly: true, usageLimit: 100, usedCount: 12 } },
    // Expired offers (for testing filtering)
    { code: 'EXPIRED10', title: 'عرض منتهي 10%', description: 'عرض منتهي الصلاحية.', type: 'percentage', value: 10, startsAt: new Date('2026-01-01'), expiresAt: yesterday, isActive: false, metadata: { usageLimit: 500, usedCount: 500 } },
    { code: 'OLD_SAVE50', title: 'خصم قديم 50 ل.س', description: 'عرض شتوي منتهي.', type: 'fixed', value: 50, startsAt: new Date('2025-12-01'), expiresAt: new Date('2026-02-28'), isActive: false, metadata: {} },
    // Future offer (not yet started)
    { code: 'EID2026', title: 'عرض العيد 30%', description: 'خصم خاص بمناسبة عيد الأضحى 2026.', type: 'percentage', value: 30, startsAt: new Date('2026-06-15'), expiresAt: new Date('2026-06-22'), isActive: true, metadata: { maxDiscount: 1000, usageLimit: 5000, usedCount: 0 } },
  ];

  offers.forEach(o => { o.createdAt = now; o.updatedAt = now; });

  await db.collection('offers').deleteMany({});
  const offerResult = await db.collection('offers').insertMany(offers);
  console.log('✅ offers: Inserted ' + offerResult.insertedCount + ' documents');

  const offerIds = Object.values(offerResult.insertedIds);

  // ============================================================
  // 4. SEED wash_plans
  // ============================================================
  const washPlans = [
    // User 0 - active full wash, 2x/month
    { userId: userIds[0], vehicleId: vehicleIds[0], addressId: addressIds[0], visitsPerMonth: 2, washType: 'full', preferredTimeSlot: 'morning', reminderEnabled: true, isActive: true, nextBookingAt: nextWeek, lastBookingAt: lastWeek, lastOrderId: orders[0] ? orders[0]._id : null },
    // User 0 - second vehicle, external only
    { userId: userIds[0], vehicleId: vehicleIds[1] || vehicleIds[0], addressId: addressIds[1], visitsPerMonth: 4, washType: 'external', preferredTimeSlot: 'evening', reminderEnabled: true, isActive: true, nextBookingAt: tomorrow, lastBookingAt: null, lastOrderId: null },
    // User 1 - active plan
    { userId: userIds[1], vehicleId: vehicleIds[2] || vehicleIds[0], addressId: addressIds[3], visitsPerMonth: 2, washType: 'internal', preferredTimeSlot: 'noon', reminderEnabled: false, isActive: true, nextBookingAt: nextWeek, lastBookingAt: lastWeek, lastOrderId: orders[1] ? orders[1]._id : null },
    // User 2 - inactive plan (paused)
    { userId: userIds[2], vehicleId: vehicleIds[3] || vehicleIds[0], addressId: addressIds[5], visitsPerMonth: 1, washType: 'full', preferredTimeSlot: 'morning', reminderEnabled: true, isActive: false, nextBookingAt: null, lastBookingAt: new Date('2026-05-15'), lastOrderId: orders[2] ? orders[2]._id : null },
    // User 3 - premium 4x/month
    { userId: userIds[3], vehicleId: vehicleIds[4] || vehicleIds[0], addressId: addressIds[7], visitsPerMonth: 4, washType: 'full', preferredTimeSlot: 'evening', reminderEnabled: true, isActive: true, nextBookingAt: tomorrow, lastBookingAt: yesterday, lastOrderId: orders[3] ? orders[3]._id : null },
    // User 4 - basic external
    { userId: userIds[4] || userIds[0], vehicleId: vehicleIds[5] || vehicleIds[0], addressId: addressIds[10] || addressIds[0], visitsPerMonth: 2, washType: 'external', preferredTimeSlot: 'morning', reminderEnabled: true, isActive: true, nextBookingAt: nextWeek, lastBookingAt: null, lastOrderId: null },
    // User 5 - weekly full
    { userId: userIds[5] || userIds[1], vehicleId: vehicleIds[6] || vehicleIds[1], addressId: addressIds[12] || addressIds[1], visitsPerMonth: 4, washType: 'full', preferredTimeSlot: 'noon', reminderEnabled: false, isActive: true, nextBookingAt: new Date(now.getTime() + 3 * 86400000), lastBookingAt: yesterday, lastOrderId: null },
    // User 6 - inactive
    { userId: userIds[6] || userIds[2], vehicleId: vehicleIds[7] || vehicleIds[2], addressId: addressIds[13] || addressIds[2], visitsPerMonth: 1, washType: 'internal', preferredTimeSlot: 'evening', reminderEnabled: false, isActive: false, nextBookingAt: null, lastBookingAt: new Date('2026-04-01'), lastOrderId: null },
  ];

  washPlans.forEach(w => { w.createdAt = now; w.updatedAt = now; });

  await db.collection('wash_plans').deleteMany({});
  const wpResult = await db.collection('wash_plans').insertMany(washPlans);
  console.log('✅ wash_plans: Inserted ' + wpResult.insertedCount + ' documents');

  // ============================================================
  // 5. SEED user_devices
  // ============================================================
  const devices = [
    // User 0 - Android + iOS
    { userId: userIds[0], fcmToken: 'fmc_android_cust0_samsung_s24_ultra_tok_001', platform: 'android', deviceName: 'Samsung Galaxy S24 Ultra', isActive: true, lastSeenAt: now },
    { userId: userIds[0], fcmToken: 'fcm_ios_cust0_iphone15pro_tok_002', platform: 'ios', deviceName: 'iPhone 15 Pro Max', isActive: true, lastSeenAt: new Date(now.getTime() - 3600000) },
    // User 1 - Android
    { userId: userIds[1], fcmToken: 'fcm_android_cust1_pixel8_tok_003', platform: 'android', deviceName: 'Google Pixel 8 Pro', isActive: true, lastSeenAt: now },
    // User 2 - iOS + old device (inactive)
    { userId: userIds[2], fcmToken: 'fcm_ios_cust2_iphone14_tok_004', platform: 'ios', deviceName: 'iPhone 14', isActive: true, lastSeenAt: now },
    { userId: userIds[2], fcmToken: 'fcm_android_cust2_old_huawei_tok_005', platform: 'android', deviceName: 'Huawei P30 (old)', isActive: false, lastSeenAt: new Date('2026-01-15') },
    // User 3 - Android
    { userId: userIds[3], fcmToken: 'fcm_android_cust3_xiaomi14_tok_006', platform: 'android', deviceName: 'Xiaomi 14 Ultra', isActive: true, lastSeenAt: now },
    // User 4 - Web
    { userId: userIds[4] || userIds[0], fcmToken: 'fcm_web_cust4_chrome_tok_007', platform: 'web', deviceName: 'Chrome Browser - Windows 11', isActive: true, lastSeenAt: yesterday },
    // User 5 - iOS
    { userId: userIds[5] || userIds[1], fcmToken: 'fcm_ios_cust5_iphone16_tok_008', platform: 'ios', deviceName: 'iPhone 16', isActive: true, lastSeenAt: now },
    // User 6 - Android
    { userId: userIds[6] || userIds[2], fcmToken: 'fcm_android_cust6_oneplus12_tok_009', platform: 'android', deviceName: 'OnePlus 12', isActive: true, lastSeenAt: now },
    // User 7 - multiple devices
    { userId: userIds[7] || userIds[3], fcmToken: 'fcm_android_cust7_samsung_a55_tok_010', platform: 'android', deviceName: 'Samsung Galaxy A55', isActive: true, lastSeenAt: now },
    { userId: userIds[7] || userIds[3], fcmToken: 'fcm_web_cust7_safari_tok_011', platform: 'web', deviceName: 'Safari Browser - MacOS', isActive: true, lastSeenAt: yesterday },
    // Inactive device from long ago
    { userId: userIds[8] || userIds[0], fcmToken: 'fcm_android_old_inactive_tok_012', platform: 'android', deviceName: 'Samsung Galaxy S20 (discontinued)', isActive: false, lastSeenAt: new Date('2025-06-01') },
  ];

  devices.forEach(d => { d.createdAt = now; d.updatedAt = now; });

  await db.collection('user_devices').deleteMany({});
  const devResult = await db.collection('user_devices').insertMany(devices);
  console.log('✅ user_devices: Inserted ' + devResult.insertedCount + ' documents');

  // ============================================================
  // VERIFICATION SUMMARY
  // ============================================================
  console.log('\n===========================================');
  console.log('  SEEDING COMPLETE - VERIFICATION');
  console.log('===========================================');

  const collections = ['user_addresses', 'user_payment_methods', 'offers', 'wash_plans', 'user_devices', 'offer_redemptions'];
  for (const col of collections) {
    const count = await db.collection(col).countDocuments();
    console.log('  ' + col + ': ' + count + ' documents');
  }

  // Print key IDs for environment
  console.log('\n=== KEY IDS FOR TESTING ===');
  console.log('  address_id: ' + addressIds[0]);
  console.log('  payment_method_id: ' + paymentMethodIds[0]);
  console.log('  offer_id: ' + offerIds[0]);
  console.log('  wash_plan_id: ' + (await db.collection('wash_plans').findOne({}))._id);
  console.log('  device_token: fmc_android_cust0_samsung_s24_ultra_tok_001');

  await client.close();
  console.log('\nDone!');
}

seed().catch(e => { console.error('SEED ERROR:', e); process.exit(1); });
