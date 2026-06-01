const mongoose = require('mongoose');
const MongoClient = mongoose.mongo.MongoClient;
const bcrypt = require('bcrypt');
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
  console.error('[خطأ] لم يتم العثور على MONGODB_URI في ملف .env بالباك إند.');
  process.exit(1);
}

// Arabic arrays for random realistic data generation
const BRANDS_AND_MODELS = {
  'Toyota': ['Camry', 'Corolla', 'RAV4', 'Land Cruiser', 'Hilux', 'Yaris'],
  'Hyundai': ['Elantra', 'Accent', 'Tucson', 'Santa Fe', 'Sonata', 'Creta'],
  'Kia': ['Cerato', 'Picanto', 'Sportage', 'Sorento', 'Rio', 'Optima'],
  'Nissan': ['Sunny', 'Altima', 'Patrol', 'Pathfinder', 'Sentra'],
  'Honda': ['Civic', 'Accord', 'CR-V', 'City'],
  'Mercedes': ['C-Class', 'E-Class', 'S-Class', 'G-Class'],
  'BMW': ['3 Series', '5 Series', '7 Series', 'X5'],
  'Chevrolet': ['Malibu', 'Tahoe', 'Captiva', 'Cruze'],
  'Ford': ['Focus', 'Explorer', 'Taurus', 'Edge']
};

const COLORS = ['أبيض', 'أسود', 'فضي', 'رمادي', 'أحمر', 'أزرق', 'كحلي', 'برونزي'];

const MAINTENANCE_TYPES = [
  { type: 'تغيير زيت المحرك والفلتر', desc: 'استبدال زيت المحرك الأصلي 10W-40 مع الفلتر المخصص للمحرك لضمان سلاسة الأداء.', cost: [150, 350], parts: ['زيت محرك 5L', 'فلتر زيت محرك'] },
  { type: 'تغيير طقم الإطارات', desc: 'تبديل طقم إطارات السيارة بأخرى جديدة موازنة ومعايرة ضغط الهواء.', cost: [800, 2400], parts: ['طقم إطارات 4 قطع'] },
  { type: 'صيانة الفرامل والفحمات', desc: 'استبدال فحمات الفرامل الأمامية والخلفية وجرط الهوبات لضمان جودة الكبح.', cost: [200, 600], parts: ['فحمات فرامل أمامية', 'فحمات فرامل خلفية', 'زيت فرامل Dot 4'] },
  { type: 'فحص عام وإصلاح كهربائي', desc: 'فحص ضفيرة السيارة وإصلاح التوصيلات التالفة للأنوار والفيوزات.', cost: [100, 300], parts: ['فيوزات منوعة', 'لمبات هالوجين'] },
  { type: 'شحن وتغيير البطارية', desc: 'تغيير بطارية السيارة ببطارية جديدة سعة 80 أمبير مع الكفالة لمدة عام.', cost: [250, 450], parts: ['بطارية السيارة 80A'] },
  { type: 'إصلاح وصيانة التكييف', desc: 'تنظيف دورة التبريد وإعادة تعبئة غاز الفريون الأصلي وتنظيف فلتر الهواء.', cost: [150, 500], parts: ['غاز فريون R134a', 'فلتر مكيف نانو'] },
  { type: 'تغيير فلتر الهواء والبواجي', desc: 'استبدال بواجي الاحتراق التالفة وفلتر الهواء لتحسين استهلاك الوقود وعزم المحرك.', cost: [120, 400], parts: ['طقم بواجي 4 قطع', 'فلتر هواء محرك'] }
];

const CHAT_CONVERSATIONS = [
  [
    { msg: "مرحباً يا غالي، أنا معطل في طريق السفر وبحاجة سطحة لنقل سيارتي.", type: "text", sender: "user" },
    { msg: "أهلاً بك أخي، لا تقلق أنا استقبلت طلبك وحالياً أجهز السطحة للتحرك فوراً.", type: "text", sender: "provider" },
    { msg: "كم من الوقت تحتاج للوصول تقريباً؟ لأن الجو حار هنا.", type: "text", sender: "user" },
    { msg: "حوالي 20 دقيقة بسبب زحمة السير. سأقوم بتعقب موقعك المحدد.", type: "text", sender: "provider" },
    { msg: "أنا بجانب محطة وقود الدريس تماماً على الطريق السريع.", type: "text", sender: "user" },
    { msg: "تمام، ظهرت المحطة عندي على الخريطة. سأتصل بك فور وصولي للمكان.", type: "text", sender: "provider" },
    { msg: "شكراً لك على سرعة الاستجابة والتعاون.", type: "text", sender: "user" },
    { msg: "على الرحب والسعة، نحن في الخدمة دائماً.", type: "text", sender: "provider" }
  ],
  [
    { msg: "السلام عليكم، هل الورشة مفتوحة الآن لإصلاح البطارية؟", type: "text", sender: "user" },
    { msg: "وعليكم السلام، نعم نحن نعمل حالياً. هل تحتاج سيارة فحص أم سحب؟", type: "text", sender: "provider" },
    { msg: "السيارة لا تعمل إطلاقاً وأظن أن البطارية تالفة تماماً وبحاجة تبديل.", type: "text", sender: "user" },
    { msg: "يمكننا إرسال فني ومعه بطارية جديدة لتركيبها وتفعيل الضمان بموقعك.", type: "text", sender: "provider" },
    { msg: "ممتاز، هذا يوفر علي عناء السحب. كم السعر الإجمالي للبطارية والتركيب؟", type: "text", sender: "user" },
    { msg: "السعر الإجمالي 350 ريال شامل الفحص والتركيب والضمان لمدة سنة.", type: "text", sender: "provider" },
    { msg: "اتفقنا، يرجى إرسال الفني بأسرع وقت.", type: "text", sender: "user" },
    { msg: "تم إرسال الفني وسيصلك خلال ربع ساعة إن شاء الله.", type: "text", sender: "provider" }
  ]
];

const NOTIFICATIONS = [
  { title: "تم قبول طلبك", body: "تم قبول طلب الصيانة الخاص بك من قبل ورشة الوفاء المعتمدة.", type: "order_updated" },
  { title: "رسالة جديدة", body: "لديك رسالة غير مقروءة من فني السحب المتجه إليك.", type: "new_message" },
  { title: "دفع ناجح", body: "تم خصم قيمة الخدمة من محفظتك بنجاح.", type: "system_alert" },
  { title: "تذكير بالصيانة", body: "تذكير: اقترب موعد تغيير زيت السيارة الدوري لسيارتك تويوتا كامري.", type: "reminder" },
  { title: "عرض خاص", body: "خصم 20% على خدمات غسيل وتلميع السيارات بمناسبة نهاية الأسبوع.", type: "info" }
];

async function seed() {
  console.log('Connecting to MongoDB Atlas...');
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();
  console.log('[OK] Connected to MongoDB Atlas.');

  // Fetch pre-seeded dependency collections
  console.log('\n[1/3] Fetching existing collections data...');
  const users = await db.collection('users').find({}).toArray();
  const providers = await db.collection('providers').find({}).toArray();
  const orders = await db.collection('orders').find({}).toArray();

  if (users.length === 0 || providers.length === 0) {
    console.error('[خطأ] يجب أن تحتوي جداول users و providers على بيانات مسبقة (التي بذرت في خطوة التوصيات).');
    await client.close();
    process.exit(1);
  }

  console.log(` - Found ${users.length} existing users.`);
  console.log(` - Found ${providers.length} existing providers.`);
  console.log(` - Found ${orders.length} existing orders.`);

  // Define clear target collections to purge and populate
  const collectionsToPurge = [
    'admins', 'settings', 'subscription_plans', 'user_subscriptions',
    'wallets', 'transactions', 'vehicles', 'maintenancerecords',
    'vehiclereminders', 'chats', 'messages', 'notifications',
    'logouts', 'pending_registrations', 'audit_logs', 'status_histories'
  ];

  console.log('\n[2/3] Clearing old operational collections...');
  for (const col of collectionsToPurge) {
    await db.collection(col).deleteMany({});
    console.log(` - Cleared ${col} collection.`);
  }
  console.log('[OK] All old collections cleared.');

  console.log('\n[3/3] Generating fresh and realistic operational data...');

  // 1. Seed Admins (5 docs)
  console.log(' - Seeding admins...');
  const adminPasswordHash = await bcrypt.hash('Admin@123456', 10);
  const adminsData = [
    { name: 'أحمد المدير العام', email: 'admin@carhero.com', password: adminPasswordHash, role: 'admin', permissions: [], isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { name: 'خالد المشرف المالي', email: 'finance.admin@carhero.com', password: adminPasswordHash, role: 'admin', permissions: ['billing', 'reports'], isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { name: 'سارة الدعم الفني', email: 'support.admin@carhero.com', password: adminPasswordHash, role: 'admin', permissions: ['tickets', 'chats'], isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { name: 'عمر مدير النظام', email: 'system.admin@carhero.com', password: adminPasswordHash, role: 'admin', permissions: ['settings', 'logs'], isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { name: 'فاطمة مديرة العمليات', email: 'manager@carhero.com', password: adminPasswordHash, role: 'admin', permissions: ['providers', 'orders'], isActive: true, createdAt: new Date(), updatedAt: new Date() }
  ];
  const adminResult = await db.collection('admins').insertMany(adminsData);
  const adminIds = Object.values(adminResult.insertedIds);
  console.log(`   [OK] Seeded ${adminsData.length} administrators.`);

  // 2. Seed Settings (10 docs)
  console.log(' - Seeding settings...');
  const settingsData = [
    { key: 'app_name', value: 'Car Hero - كار هيرو', maintenanceMode: false, group: 'general', isPublic: true, description: 'اسم التطبيق الرسمي', createdAt: new Date(), updatedAt: new Date() },
    { key: 'app_version', value: '1.0.0', maintenanceMode: false, group: 'general', isPublic: true, description: 'إصدار التطبيق الحالي', createdAt: new Date(), updatedAt: new Date() },
    { key: 'maintenance_mode', value: false, maintenanceMode: false, group: 'system', isPublic: true, description: 'تفعيل وضع الصيانة العام', createdAt: new Date(), updatedAt: new Date() },
    { key: 'maintenance_message_ar', value: 'سيعود النظام قريباً للعمل بعد انتهاء الصيانة الدورية.', maintenanceMode: false, group: 'system', isPublic: true, description: 'رسالة الصيانة بالعربية', createdAt: new Date(), updatedAt: new Date() },
    { key: 'contact_email', value: 'support@carhero.com', maintenanceMode: false, group: 'contact', isPublic: true, description: 'بريد الدعم الفني والمراسلات', createdAt: new Date(), updatedAt: new Date() },
    { key: 'contact_phone', value: '+966501234567', maintenanceMode: false, group: 'contact', isPublic: true, description: 'رقم هاتف الاتصال الرسمي', createdAt: new Date(), updatedAt: new Date() },
    { key: 'min_withdrawal_amount', value: 100, maintenanceMode: false, group: 'finance', isPublic: false, description: 'الحد الأدنى لعملية سحب الورش لرصيدها (ريال)', createdAt: new Date(), updatedAt: new Date() },
    { key: 'commission_rate', value: 0.15, maintenanceMode: false, group: 'finance', isPublic: false, description: 'نسبة عمولة المنصة الافتراضية من الخدمات (15%)', createdAt: new Date(), updatedAt: new Date() },
    { key: 'default_currency', value: 'SAR', maintenanceMode: false, group: 'finance', isPublic: true, description: 'عملة النظام الافتراضية في الخليج', createdAt: new Date(), updatedAt: new Date() },
    { key: 'sms_verification_enabled', value: true, maintenanceMode: false, group: 'auth', isPublic: false, description: 'تفعيل التحقق برسائل الجوال OTP', createdAt: new Date(), updatedAt: new Date() }
  ];
  await db.collection('settings').insertMany(settingsData);
  console.log(`   [OK] Seeded ${settingsData.length} global configuration settings.`);

  // 3. Seed Subscription Plans (3 docs)
  console.log(' - Seeding subscription plans...');
  const plansData = [
    {
      name: 'Bronze Plan',
      nameAr: 'الباقة البرونزية',
      description: 'Free starter tier with basic features.',
      descriptionAr: 'الباقة المجانية للمستخدمين الجدد مع ميزات أساسية.',
      price: 0,
      durationDays: 30,
      features: ['10 Free Recommendations/month', 'Basic roadside assistance support'],
      featuresAr: ['10 ترشيحات ذكية مجانية شهرياً', 'دعم فني ومساعدة أساسية على الطريق'],
      isActive: true,
      tier: 'basic',
      sortOrder: 1,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Silver Plan',
      nameAr: 'الباقة الفضية',
      description: 'Professional package for active drivers.',
      descriptionAr: 'الباقة الاحترافية للسائقين النشطين بميزات متقدمة.',
      price: 99,
      durationDays: 30,
      features: ['50 Recommendations/month', '24/7 Priority Support', '10% discount on tow services'],
      featuresAr: ['50 ترشيحاً ذكياً شهرياً', 'دعم فني ذو أولوية على مدار الساعة 24/7', 'خصم 10% على كافة خدمات السحب'],
      isActive: true,
      tier: 'silver',
      sortOrder: 2,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Gold Plan',
      nameAr: 'الباقة الذهبية',
      description: 'Ultimate annual VIP package.',
      descriptionAr: 'الباقة السنوية الذهبية لكبار الشخصيات تغطية شاملة.',
      price: 799,
      durationDays: 365,
      features: ['Unlimited Recommendations', 'VIP Support Desk', 'No commission fee on tow services', 'Dashboard access'],
      featuresAr: ['ترشيحات ذكية غير محدودة', 'خط دعم VIP مخصص ومباشر', 'عمولة 0% على كافة طلبات السحب للسيارات المشحونة', 'لوحة تحليلات وإحصائيات مفصلة'],
      isActive: true,
      tier: 'gold',
      sortOrder: 3,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  const plansResult = await db.collection('subscription_plans').insertMany(plansData);
  const planIds = Object.values(plansResult.insertedIds);
  console.log(`   [OK] Seeded ${plansData.length} subscription plans.`);

  // 4. Seed User Subscriptions (150 docs)
  console.log(' - Seeding user subscriptions...');
  const userSubs = [];
  const selectedUsersForSubs = users.slice(0, 150);
  selectedUsersForSubs.forEach((u, index) => {
    const planIndex = Math.floor(Math.random() * plansData.length);
    const plan = plansData[planIndex];
    const planId = planIds[planIndex];
    
    // Distribute start dates over last 6 months
    const startDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
    
    const isExpired = endDate < new Date();
    const status = isExpired ? 'expired' : (Math.random() > 0.9 ? 'cancelled' : 'active');

    userSubs.push({
      user: u._id,
      plan: planId,
      startDate,
      endDate,
      status,
      autoRenew: Math.random() > 0.3,
      amountPaid: plan.price,
      lastPaymentId: plan.price > 0 ? `PAY-${Date.now()}-${index}` : undefined,
      createdAt: startDate,
      updatedAt: startDate
    });
  });
  await db.collection('user_subscriptions').insertMany(userSubs);
  console.log(`   [OK] Seeded ${userSubs.length} user subscription records.`);

  // 5. Seed Wallets (500 users + 1785 providers = 2285 wallets)
  console.log(' - Seeding wallets for users and providers...');
  const wallets = [];
  
  // Wallets for Users
  users.forEach(u => {
    wallets.push({
      ownerId: u._id,
      ownerType: 'user',
      balance: parseFloat((Math.random() * 800 + 50).toFixed(2)),
      loyaltyPoints: Math.floor(Math.random() * 200),
      pendingBalance: 0,
      currency: 'SAR',
      isActive: true,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });

  // Wallets for Providers
  providers.forEach(p => {
    wallets.push({
      ownerId: p._id,
      ownerType: 'provider',
      balance: parseFloat((Math.random() * 15000 + 500).toFixed(2)),
      loyaltyPoints: 0,
      pendingBalance: parseFloat((Math.random() * 1200).toFixed(2)),
      currency: 'SAR',
      isActive: true,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });

  const walletsResult = await db.collection('wallets').insertMany(wallets);
  const walletsList = await db.collection('wallets').find({}).toArray();
  const walletsMap = new Map(); // ownerId_ownerType -> walletId
  walletsList.forEach(w => {
    walletsMap.set(`${w.ownerId.toString()}_${w.ownerType}`, w);
  });
  console.log(`   [OK] Seeded ${walletsList.length} wallets in database.`);

  // 6. Seed Transactions (300 docs)
  console.log(' - Seeding transactions...');
  const transactions = [];
  const ordersWithParticipants = orders.filter(o => o.user && o.provider);
  const sampledOrders = ordersWithParticipants.slice(0, 150); // Use 150 orders to build transactions
  
  // 150 transactions linked directly to orders
  sampledOrders.forEach((o, index) => {
    const userWallet = walletsMap.get(`${o.user.toString()}_user`);
    const providerWallet = walletsMap.get(`${o.provider.toString()}_provider`);
    
    if (userWallet && providerWallet) {
      const orderAmount = parseFloat((Math.random() * 250 + 100).toFixed(2));
      const orderDate = o.createdAt || new Date();
      
      // Debit user
      transactions.push({
        transactionNumber: `TXN-${orderDate.getTime()}-${index}-U`,
        wallet: userWallet._id,
        ownerId: o.user,
        ownerType: 'user',
        type: 'debit',
        amount: orderAmount,
        balanceBefore: parseFloat((userWallet.balance + orderAmount).toFixed(2)),
        balanceAfter: userWallet.balance,
        description: `دفع لقاء طلب صيانة سيارة رقم #${o.orderNumber || index}`,
        referenceType: 'order',
        referenceId: o._id,
        paymentMethod: 'wallet',
        status: 'completed',
        pointsEarned: Math.floor(orderAmount / 10),
        pointsRedeemed: 0,
        metadata: {},
        createdAt: orderDate,
        updatedAt: orderDate
      });

      // Credit provider
      const commission = parseFloat((orderAmount * 0.15).toFixed(2));
      const providerAmount = parseFloat((orderAmount - commission).toFixed(2));
      transactions.push({
        transactionNumber: `TXN-${orderDate.getTime()}-${index}-P`,
        wallet: providerWallet._id,
        ownerId: o.provider,
        ownerType: 'provider',
        type: 'credit',
        amount: providerAmount,
        balanceBefore: providerWallet.balance,
        balanceAfter: parseFloat((providerWallet.balance + providerAmount).toFixed(2)),
        description: `تحصيل رصيد الطلب المكتمل رقم #${o.orderNumber || index} بعد خصم عمولة المنصة`,
        referenceType: 'order',
        referenceId: o._id,
        paymentMethod: 'wallet',
        status: 'completed',
        pointsEarned: 0,
        pointsRedeemed: 0,
        metadata: {},
        createdAt: orderDate,
        updatedAt: orderDate
      });
    }
  });

  // 150 generic transactions (topups and withdrawals)
  for (let k = 0; k < 150; k++) {
    const isUser = Math.random() > 0.5;
    const transDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
    
    if (isUser) {
      const u = users[Math.floor(Math.random() * users.length)];
      const w = walletsMap.get(`${u._id.toString()}_user`);
      if (w) {
        const topupAmt = Math.floor(Math.random() * 500) + 100;
        transactions.push({
          transactionNumber: `TXN-${transDate.getTime()}-${k}-TOP`,
          wallet: w._id,
          ownerId: u._id,
          ownerType: 'user',
          type: 'credit',
          amount: topupAmt,
          balanceBefore: w.balance,
          balanceAfter: parseFloat((w.balance + topupAmt).toFixed(2)),
          description: 'شحن رصيد المحفظة عبر بطاقة مدى البنكية',
          referenceType: 'topup',
          paymentMethod: 'card',
          status: 'completed',
          pointsEarned: 0,
          pointsRedeemed: 0,
          metadata: {},
          createdAt: transDate,
          updatedAt: transDate
        });
      }
    } else {
      const p = providers[Math.floor(Math.random() * providers.length)];
      const w = walletsMap.get(`${p._id.toString()}_provider`);
      if (w && w.balance > 1000) {
        const withdrawAmt = Math.floor(Math.random() * 1000) + 500;
        transactions.push({
          transactionNumber: `TXN-${transDate.getTime()}-${k}-WIT`,
          wallet: w._id,
          ownerId: p._id,
          ownerType: 'provider',
          type: 'debit',
          amount: withdrawAmt,
          balanceBefore: w.balance,
          balanceAfter: parseFloat((w.balance - withdrawAmt).toFixed(2)),
          description: 'تحويل رصيد المحفظة إلى الحساب البنكي المعتمد للورشة',
          referenceType: 'withdrawal',
          paymentMethod: 'bank_transfer',
          status: 'completed',
          pointsEarned: 0,
          pointsRedeemed: 0,
          metadata: {},
          createdAt: transDate,
          updatedAt: transDate
        });
      }
    }
  }

  await db.collection('transactions').insertMany(transactions);
  console.log(`   [OK] Seeded ${transactions.length} financial transactions.`);

  // 7. Seed Vehicles (400 docs)
  console.log(' - Seeding vehicles for users...');
  const vehicles = [];
  const brands = Object.keys(BRANDS_AND_MODELS);
  const selectedUsersForVehicles = users.slice(0, 400); // 400 users get a vehicle
  
  selectedUsersForVehicles.forEach((user, index) => {
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const modelList = BRANDS_AND_MODELS[brand];
    const model = modelList[Math.floor(Math.random() * modelList.length)];
    const year = Math.floor(Math.random() * 13) + 2012; // years between 2012 and 2025
    const plateLetters = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ي'];
    const letter1 = plateLetters[Math.floor(Math.random() * plateLetters.length)];
    const letter2 = plateLetters[Math.floor(Math.random() * plateLetters.length)];
    const letter3 = plateLetters[Math.floor(Math.random() * plateLetters.length)];
    const num = Math.floor(Math.random() * 9000) + 1000;
    const plateNumber = `${letter1} ${letter2} ${letter3} ${num}`;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const vin = `9C6AM10${Math.floor(Math.random() * 9)}XG${Math.floor(Math.random() * 900000) + 100000}`;

    vehicles.push({
      owner: user._id,
      brand,
      model,
      year,
      plateNumber,
      color,
      vin,
      isActive: true,
      isDefault: true,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 50 users get a second vehicle (which is not default)
    if (index < 50) {
      const secondBrand = brands[(brands.indexOf(brand) + 1) % brands.length];
      const secondModelList = BRANDS_AND_MODELS[secondBrand];
      const secondModel = secondModelList[Math.floor(Math.random() * secondModelList.length)];
      const secondYear = Math.floor(Math.random() * 10) + 2014;
      const sLetter1 = plateLetters[Math.floor(Math.random() * plateLetters.length)];
      const sLetter2 = plateLetters[Math.floor(Math.random() * plateLetters.length)];
      const sLetter3 = plateLetters[Math.floor(Math.random() * plateLetters.length)];
      const sNum = Math.floor(Math.random() * 9000) + 1000;
      
      vehicles.push({
        owner: user._id,
        brand: secondBrand,
        model: secondModel,
        year: secondYear,
        plateNumber: `${sLetter1} ${sLetter2} ${sLetter3} ${sNum}`,
        color: COLORS[(COLORS.indexOf(color) + 1) % COLORS.length],
        vin: `9C6AM10${Math.floor(Math.random() * 9)}XG${Math.floor(Math.random() * 900000) + 100000}`,
        isActive: true,
        isDefault: false,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  });

  const vehiclesResult = await db.collection('vehicles').insertMany(vehicles);
  const vehiclesList = await db.collection('vehicles').find({}).toArray();
  console.log(`   [OK] Seeded ${vehiclesList.length} customer vehicles.`);

  // 8. Seed Maintenance Records (600 docs)
  console.log(' - Seeding maintenance records...');
  const maintenanceRecords = [];
  for (let m = 0; m < 600; m++) {
    const v = vehiclesList[Math.floor(Math.random() * vehiclesList.length)];
    const mType = MAINTENANCE_TYPES[Math.floor(Math.random() * MAINTENANCE_TYPES.length)];
    const cost = Math.floor(Math.random() * (mType.cost[1] - mType.cost[0])) + mType.cost[0];
    const date = new Date(Date.now() - Math.random() * 365 * 2 * 24 * 60 * 60 * 1000); // last 2 years
    const mileage = Math.floor(Math.random() * 150000) + 10000;
    const providerName = providers[Math.floor(Math.random() * providers.length)].name || 'مركز خدمة معتمد';

    maintenanceRecords.push({
      vehicle: v._id,
      user: v.owner,
      serviceType: mType.type,
      description: mType.desc,
      date,
      mileage,
      cost,
      provider: providerName,
      location: 'الرياض، السعودية',
      invoiceNumber: `INV-${date.getTime()}-${m}`,
      parts: mType.parts,
      notes: 'تمت الصيانة بنجاح واستلم العميل السيارة.',
      attachments: []
    });
  }
  await db.collection('maintenancerecords').insertMany(maintenanceRecords);
  console.log(`   [OK] Seeded ${maintenanceRecords.length} historical vehicle maintenance records.`);

  // 9. Seed Vehicle Reminders (200 docs)
  console.log(' - Seeding vehicle reminders...');
  const reminders = [];
  const reminderTypes = ['oil_change', 'tire_rotation', 'brake_inspection', 'insurance_renewal', 'periodic_inspection'];
  for (let r = 0; r < 200; r++) {
    const v = vehiclesList[Math.floor(Math.random() * vehiclesList.length)];
    const type = reminderTypes[Math.floor(Math.random() * reminderTypes.length)];
    const reminderDate = new Date(Date.now() + (Math.random() * 180 - 30) * 24 * 60 * 60 * 1000); // -30 days to +150 days
    
    let title = 'صيانة دورية للسيارة';
    let description = 'يرجى مراجعة مركز الخدمة للصيانة المجدولة.';
    
    if (type === 'oil_change') {
      title = 'تغيير زيت المحرك والفلتر القادم';
      description = 'تبقى حوالي 500 كم لتغيير زيت المحرك، احجز موعدك الآن.';
    } else if (type === 'insurance_renewal') {
      title = 'تجديد تأمين السيارة السنوي';
      description = 'ينتهي تأمين السيارة قريباً، يرجى التجديد لتجنب المخالفات.';
    } else if (type === 'periodic_inspection') {
      title = 'الفحص الفني الدوري للسيارة';
      description = 'موعد فحص السيارة السنوي لدى المحطة المعتمدة.';
    }

    reminders.push({
      vehicle: v._id,
      user: v.owner,
      type,
      title,
      description,
      reminderDate,
      mileageThreshold: Math.floor(Math.random() * 5000) + 50000,
      currentMileage: Math.floor(Math.random() * 5000) + 45000,
      frequency: 'once',
      isActive: reminderDate > new Date(),
      isRecurring: false,
      notes: ''
    });
  }
  await db.collection('vehiclereminders').insertMany(reminders);
  console.log(`   [OK] Seeded ${reminders.length} upcoming maintenance reminders.`);

  // 10. Seed Chats & Messages (150 chats, 800 messages)
  console.log(' - Seeding active chats and messaging...');
  const chats = [];
  const chatMessages = [];
  
  // Pick 150 orders to establish chats
  const ordersForChats = ordersWithParticipants.slice(0, 150);
  ordersForChats.forEach((o, chatIdx) => {
    const chatId = new mongoose.Types.ObjectId();
    const chatDate = o.createdAt || new Date();
    
    // Alternate conversations
    const conversation = CHAT_CONVERSATIONS[chatIdx % CHAT_CONVERSATIONS.length];
    
    // Map participants
    const participants = [o.user, o.provider];
    
    chats.push({
      _id: chatId,
      orderId: o._id,
      participants,
      isActive: Math.random() > 0.15,
      lastMessage: conversation[conversation.length - 1].msg,
      lastMessageAt: new Date(chatDate.getTime() + conversation.length * 60 * 1000),
      lastMessageBy: conversation[conversation.length - 1].sender === 'user' ? o.user : o.provider,
      unreadCounts: { [o.user.toString()]: 0, [o.provider.toString()]: 0 }
    });

    // Populate messages collection
    conversation.forEach((c, msgIdx) => {
      const msgDate = new Date(chatDate.getTime() + msgIdx * 60 * 1000);
      chatMessages.push({
        chatId: chatId,
        senderId: c.sender === 'user' ? o.user : o.provider,
        receiverId: c.sender === 'user' ? o.provider : o.user,
        message: c.msg,
        type: c.type,
        sentAt: msgDate,
        isRead: true,
        readAt: new Date(msgDate.getTime() + 30 * 1000)
      });
    });
  });

  await db.collection('chats').insertMany(chats);
  await db.collection('messages').insertMany(chatMessages);
  console.log(`   [OK] Seeded ${chats.length} chat rooms and ${chatMessages.length} messaging logs.`);

  // 11. Seed Notifications (500 docs)
  console.log(' - Seeding in-app notifications...');
  const notifications = [];
  for (let n = 0; n < 500; n++) {
    const isUser = Math.random() > 0.3; // 70% to users, 30% to providers
    const template = NOTIFICATIONS[n % NOTIFICATIONS.length];
    const recId = isUser ? users[Math.floor(Math.random() * users.length)]._id : providers[Math.floor(Math.random() * providers.length)]._id;
    const recType = isUser ? 'user' : 'provider';
    const isRead = Math.random() > 0.4;
    const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // last 30 days

    notifications.push({
      recipientId: recId,
      recipientType: recType,
      title: template.title,
      body: template.body,
      type: template.type,
      data: { click_action: 'FLUTTER_NOTIFICATION_CLICK' },
      isRead,
      readAt: isRead ? new Date(createdAt.getTime() + 10 * 60 * 1000) : undefined,
      createdAt,
      updatedAt: createdAt
    });
  }
  await db.collection('notifications').insertMany(notifications);
  console.log(`   [OK] Seeded ${notifications.length} customer and provider notifications.`);

  // 12. Seed Logouts (100 docs)
  console.log(' - Seeding logout audits...');
  const logouts = [];
  const selectedUsersForLogouts = users.slice(0, 100);
  selectedUsersForLogouts.forEach((u, index) => {
    const date = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000);
    logouts.push({
      userId: u._id,
      refreshTokenHash: `REFRESH-HASH-${date.getTime()}-${index}`,
      ipAddress: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
      success: true,
      reason: Math.random() > 0.85 ? 'expired' : 'manual',
      createdAt: date,
      updatedAt: date
    });
  });
  await db.collection('logouts').insertMany(logouts);
  console.log(`   [OK] Seeded ${logouts.length} logout transaction audits.`);

  // 13. Seed Pending Registrations (15 docs)
  console.log(' - Seeding pending registrations (OTP flow)...');
  const pendingRegs = [];
  const syrianNames = ['محمد الحلبي', 'زياد الخطيب', 'أحمد يوسف', 'سليم الصباغ', 'ريم سليمان', 'هدى حرب', 'لجين إبراهيم'];
  for (let p = 0; p < 15; p++) {
    const phone = `+9639${Math.floor(Math.random() * 90000000) + 10000000}`;
    const name = syrianNames[p % syrianNames.length];
    const otp = `${Math.floor(Math.random() * 9000) + 1000}`;
    const date = new Date();

    pendingRegs.push({
      phoneNumber: phone,
      fullName: name,
      password: adminPasswordHash,
      accountType: Math.random() > 0.8 ? 'provider' : 'customer',
      isTermsAccepted: true,
      otpCode: otp,
      otpExpiresAt: new Date(date.getTime() + 10 * 60 * 1000), // expires in 10m
      otpAttempts: 0,
      expiresAt: new Date(date.getTime() + 10 * 60 * 1000)
    });
  }
  await db.collection('pending_registrations').insertMany(pendingRegs);
  console.log(`   [OK] Seeded ${pendingRegs.length} active pending registrations.`);

  // 14. Seed Audit Logs (300 docs)
  console.log(' - Seeding admin audit logs...');
  const auditLogs = [];
  const auditActions = [
    { action: 'UPDATE_SETTINGS', type: 'SystemSetting', summary: 'تعديل النسبة العامة لعمولة المنصة من الخدمات المقدمة' },
    { action: 'APPROVE_PROVIDER', type: 'Provider', summary: 'الموافقة المباشرة على طلب الانضمام لمركز صيانة جديد' },
    { action: 'SUSPEND_PROVIDER', type: 'Provider', summary: 'تجميد حساب ورشة مؤقتاً لمخالفة شروط سرعة الاستجابة' },
    { action: 'DELETE_PROMOCODE', type: 'PromoCode', summary: 'حذف كود خصم منتهي الصلاحية من لوحة التحكم' },
    { action: 'BAN_USER', type: 'User', summary: 'تجميد حساب مستخدم بسبب سلوك دفع غير موثوق' }
  ];

  for (let a = 0; a < 300; a++) {
    const adminIndex = Math.floor(Math.random() * adminsData.length);
    const admin = adminsData[adminIndex];
    const adminId = adminIds[adminIndex];
    
    const act = auditActions[a % auditActions.length];
    const date = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
    
    auditLogs.push({
      admin: adminId,
      adminEmail: admin.email,
      adminName: admin.name,
      action: act.action,
      entityType: act.type,
      entityId: new mongoose.Types.ObjectId(),
      summary: act.summary,
      before: { active: true },
      after: { active: false },
      metadata: {},
      ipAddress: `172.16.10.${Math.floor(Math.random() * 100) + 1}`,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      createdAt: date,
      updatedAt: date
    });
  }
  await db.collection('audit_logs').insertMany(auditLogs);
  console.log(`   [OK] Seeded ${auditLogs.length} admin action audit logs.`);

  // 15. Seed Status Histories (400 docs)
  console.log(' - Seeding status histories (Order lifecycle logs)...');
  const statusHistories = [];
  const statusFlows = [
    ['pending', 'accepted', 'provider_assigned', 'provider_en_route', 'provider_arrived', 'in_progress', 'completed'],
    ['pending', 'accepted', 'provider_assigned', 'cancelled'],
    ['pending', 'rejected']
  ];

  const ordersForHistory = ordersWithParticipants.slice(0, 200); // 200 orders get history records
  ordersForHistory.forEach((o, index) => {
    const date = o.createdAt || new Date();
    
    // Choose status flow
    let flow = statusFlows[0];
    if (o.status === 'cancelled') {
      flow = statusFlows[1];
    } else if (o.status === 'rejected') {
      flow = statusFlows[2];
    }
    
    let currentT = date.getTime();
    flow.forEach((status, flowIdx) => {
      // 10 to 30 mins delay between statuses
      currentT += (Math.random() * 20 + 10) * 60 * 1000;
      
      statusHistories.push({
        entityType: 'order',
        entityId: o._id,
        orderNumber: o.orderNumber || `ORD-${date.getTime()}-${index}`,
        fromStatus: flowIdx > 0 ? flow[flowIdx - 1] : undefined,
        toStatus: status,
        changedBy: flowIdx % 2 === 0 ? o.user : o.provider,
        changedByRole: flowIdx % 2 === 0 ? 'user' : 'provider',
        changedByType: flowIdx % 2 === 0 ? 'customer' : 'workshop',
        reason: status === 'cancelled' ? 'العميل قام بإلغاء الطلب لتأخر السطحة' : undefined,
        metadata: {},
        createdAt: new Date(currentT),
        updatedAt: new Date(currentT)
      });
    });
  });

  await db.collection('status_histories').insertMany(statusHistories);
  console.log(`   [OK] Seeded ${statusHistories.length} state transition histories.`);

  console.log('\n====================================================');
  console.log('   [SUCCESS] Seeded all 17 collections successfully!');
  console.log('====================================================');
  
  await client.close();
}

seed().catch(err => {
  console.error('Fatal error during seeding database:', err);
  process.exit(1);
});
