// ============================================================
//  إسناد خدمات واقعية ومتنوّعة لكل مزوّد في القاعدة
//
//  **لماذا هذا السكربت أصلاً؟** ١٩١٠ مزوّداً في القاعدة، ٤٧ منهم فقط يملكون
//  `services` غير فارغة — والباقي **لا يظهر في بحث العميل مهما فُعِّل**، لأن
//  `/providers/nearby?serviceId=` و`create-order` كلاهما يشترط
//  `services: <معرّف الخدمة>`. تفعيل الاتصال وحده كان سيُنتج قائمة فارغة.
//
//  القواعد:
//   ١. **محطات المحروقات: الوقود وحده.** محطة تعرض «تغيير إطار» أو «سحب» تكذب
//      على من يقرأ القائمة، والمناقشة تُقرأ فيها هذه التفاصيل.
//   ٢. **تغيير الإطار عند كل من عداها** — الخدمة المشتركة التي تجعل أي بحث
//      عنها يُرجع قائمة مأهولة في أي مدينة.
//   ٣. خدمات إضافية تُشتقّ من **نشاط المزوّد المعلن** (`category`) ثم من اسمه،
//      بعشوائية **ثابتة** مشتقّة من معرّفه: نفس المزوّد يأخذ نفس الخدمات في كل
//      تشغيل، فلا تتبدّل قائمةٌ صُوّرت بالأمس.
//   ٤. **مزوّد العرض لا يُلمس** — خدماته وأسعاره كما ضبطها صاحبه.
//
//  السعر: سعر الكتالوج ± ٢٥٪ بانحراف ثابت لكل مزوّد، فتظهر في القائمة ثلاثة
//  أسعار مختلفة لا ثلاث نسخ من رقم واحد. ومن سعّر خدمةً من قبل يبقى سعره.
// ============================================================
const { connect, demoProvider, seededRandom, log } = require('./_shared.cjs');

/** فئات الكتالوج التسع كما في `ACTIVE_SERVICE_CATEGORIES` */
const FUEL = 'fuel';
const TIRE = 'tire';

/**
 * نشاط المزوّد المعلن ← الخدمات التي يعقل أن يقدّمها.
 * `always` تُسنَد دائماً، و`pool` يُنتقى منها عدد عشوائي ثابت.
 */
const BY_CATEGORY = {
  'محطة محروقات': { always: [FUEL], pool: [], stationOnly: true },
  'مركز صيانة ميكانيكا': { always: [TIRE], pool: ['breakdown', 'engine', 'battery', 'towing', 'oil'] },
  'صيانة دراجات نارية': { always: [TIRE], pool: ['breakdown', 'battery'] },
  'كهرباء وتكييف سيارات': { always: [TIRE], pool: ['battery', 'engine', 'breakdown'] },
  'مغسلة سيارات': { always: [TIRE], pool: ['car_wash'] },
  'غسيل وتلميع': { always: [TIRE], pool: ['car_wash'] },
  'مركز إطارات وزوايا': { always: [TIRE], pool: ['battery', 'breakdown'] },
  'خدمة إطارات': { always: [TIRE], pool: ['battery'] },
  'مركز صيانة هياكل ودهان': { always: [TIRE], pool: ['breakdown', 'towing'] },
  'مركز فحص فني': { always: [TIRE], pool: ['engine', 'breakdown', 'oil'] },
  'صيانة آليات ثقيلة': { always: [TIRE], pool: ['towing', 'breakdown', 'engine'] },
  'مرآب ومواقف سيارات': { always: [TIRE], pool: ['car_wash', 'lockout'] },
  'متجر قطع غيار': { always: [TIRE], pool: ['battery', 'oil'] },
  'وكالة سيارات': { always: [TIRE], pool: ['oil', 'engine', 'car_wash'] },

  // مزوّدو الاختبار المسجّلون بفئة إنجليزية — تُقرأ كما هي
  towing: { always: [TIRE], pool: ['towing', 'breakdown'] },
  battery: { always: [TIRE], pool: ['battery', 'breakdown'] },
  tire: { always: [TIRE], pool: ['battery'] },
  lockout: { always: [TIRE], pool: ['lockout', 'breakdown'] },
  car_wash: { always: [TIRE], pool: ['car_wash'] },
  fuel: { always: [FUEL], pool: [], stationOnly: true },
  maintenance: { always: [TIRE], pool: ['oil', 'engine', 'breakdown'] },
  repair: { always: [TIRE], pool: ['breakdown', 'engine'] },
  mechanical: { always: [TIRE], pool: ['breakdown', 'engine', 'battery'] },
  roadside_assistance: { always: [TIRE], pool: ['towing', 'battery', 'lockout', 'breakdown'] },
  mobile: { always: [TIRE], pool: ['battery', 'breakdown'] },
};

/** حين يغيب النشاط المعلن أو لا يُعرف، نقرأ اسم المنشأة */
const BY_NAME = [
  { test: /محطة|محروقات|وقود|بنزين|كاز|بترول/, rule: { always: [FUEL], pool: [], stationOnly: true } },
  { test: /إطار|اطار|دواليب|كوتش/, rule: { always: [TIRE], pool: ['battery', 'breakdown'] } },
  { test: /مغسل|غسيل|تلميع|تنظيف/, rule: { always: [TIRE], pool: ['car_wash'] } },
  { test: /بطاري|كهرباء|تبريد|تكييف/, rule: { always: [TIRE], pool: ['battery', 'engine'] } },
  { test: /زيت|تشحيم|فلتر/, rule: { always: [TIRE], pool: ['oil', 'engine'] } },
  { test: /سحب|ونش|قطر|رافعة/, rule: { always: [TIRE], pool: ['towing', 'breakdown'] } },
  { test: /مفاتيح|أقفال|اقفال/, rule: { always: [TIRE], pool: ['lockout', 'breakdown'] } },
  { test: /محرك|مكنة|موتور/, rule: { always: [TIRE], pool: ['engine', 'breakdown'] } },
  { test: /ميكانيك|صيانة|تصليح|خدمات|مركز/, rule: { always: [TIRE], pool: ['breakdown', 'engine', 'battery', 'oil'] } },
];

const DEFAULT_RULE = { always: [TIRE], pool: ['breakdown', 'battery', 'towing'] };

function ruleFor(provider) {
  const byCategory = BY_CATEGORY[provider.category];
  if (byCategory) return byCategory;

  const name = provider.businessName || '';
  const byName = BY_NAME.find(({ test }) => test.test(name));
  if (byName) return byName.rule;

  return DEFAULT_RULE;
}

(async () => {
  const { client, db } = await connect();
  try {
    const demo = await demoProvider(db);

    const catalog = await db
      .collection('services')
      .find({ isActive: true }, { projection: { category: 1, name: 1, nameAr: 1, basePrice: 1, discountedPrice: 1 } })
      .toArray();

    /** فئة ← خدمة الكتالوج. الفئات تسع وخدمة واحدة لكل فئة */
    const byCategory = new Map();
    for (const service of catalog) {
      if (!byCategory.has(service.category)) byCategory.set(service.category, service);
    }
    log('الكتالوج: ' + byCategory.size + ' خدمة فعّالة (' + [...byCategory.keys()].join('، ') + ')');

    const providers = await db
      .collection('providers')
      .find(
        { _id: { $ne: demo._id } },
        { projection: { businessName: 1, category: 1, servicePrices: 1 } },
      )
      .toArray();

    const operations = [];
    const tally = { stations: 0, others: 0, servicesTotal: 0 };

    for (const provider of providers) {
      const rule = ruleFor(provider);
      const random = seededRandom(provider._id.toString());

      const chosen = new Set(rule.always);
      if (rule.pool.length) {
        // من صفر إلى ثلاث خدمات إضافية — التنوّع مقصود: قائمة يقدّم فيها
        // الجميع كل شيء تبدو مولّدة، وهي كذلك.
        const extras = Math.floor(random() * Math.min(4, rule.pool.length + 1));
        const shuffled = [...rule.pool].sort(() => random() - 0.5);
        shuffled.slice(0, extras).forEach((category) => chosen.add(category));
      }

      const services = [];
      const servicePrices = {};
      const serviceAvailability = {};
      const servicesList = [];
      const categories = [];

      for (const category of chosen) {
        const service = byCategory.get(category);
        if (!service) continue;

        const id = service._id.toString();
        const base = service.discountedPrice || service.basePrice || 0;
        const existing = Number((provider.servicePrices || {})[id]);
        // سعر سبق أن أعلنه المزوّد يبقى له — السكربت يملأ الفراغ لا يكتب فوق قرار
        const price = Number.isFinite(existing) && existing > 0
          ? existing
          : Math.max(5, Math.round((base * (0.75 + random() * 0.5)) / 5) * 5);

        services.push(service._id);
        servicePrices[id] = price;
        serviceAvailability[id] = true;
        categories.push(category);
        servicesList.push({
          service_id: id,
          name: service.nameAr || service.name,
          category,
          price,
          isActive: true,
        });
      }

      if (!services.length) continue;

      if (rule.stationOnly) tally.stations += 1;
      else tally.others += 1;
      tally.servicesTotal += services.length;

      operations.push({
        updateOne: {
          filter: { _id: provider._id },
          // نفس الحقول الستّة التي يكتبها `ManageProvidersUseCase.updateServices`
          // بالضبط — وثيقةٌ ملأها السكربت يجب ألا تختلف عن وثيقة مزوّدٍ عدّل
          // خدماته من لوحته، وإلا اختلفت صفحة «خدماتي وأسعاري» بينهما.
          update: {
            $set: {
              services,
              requestedServices: services.map((id) => id.toString()),
              servicePrices,
              serviceAvailability,
              serviceCategories: categories,
              services_list: servicesList,
            },
          },
        },
      });
    }

    let modified = 0;
    for (let i = 0; i < operations.length; i += 500) {
      const result = await db.collection('providers').bulkWrite(operations.slice(i, i + 500), { ordered: false });
      modified += result.modifiedCount;
    }

    log('');
    log('✔ أُسندت الخدمات إلى ' + modified + ' مزوّداً');
    log('   محطات محروقات (وقود فقط): ' + tally.stations);
    log('   غيرها (تغيير الإطار + خدمات متنوّعة): ' + tally.others);
    log('   متوسّط عدد الخدمات للمزوّد الواحد: ' + (tally.servicesTotal / Math.max(1, operations.length)).toFixed(2));
    log('   مزوّد العرض «' + demo.businessName + '» لم يُلمس.');
  } finally {
    await client.close();
  }
})().catch((error) => {
  console.error('✖ فشل إسناد الخدمات:', error.message);
  process.exit(1);
});
