/**
 * كتالوج خطط الاشتراك — المصدر الوحيد لباقتَي Car Hero.
 *
 * كان لكل موضع خططه الخاصة: الموقع يعرض «مجانية/مميزة» بسعرين (٠ و١٥,٠٠٠
 * ل.س)، بينما القاعدة كانت تحمل ثلاث وثائق باقة أخرى («البرونزية/الفضية/
 * الذهبية» بأسعار ٠/٩٩/٧٩٩) — لا علاقة لها بنصّ الموقع، وقد كتبها **ثلاثة**
 * مصادر بذر متضاربة (`database/seeders/seed.ts`، و`SubscriptionSeederService`
 * التي كانت تُعيد بذرها تلقائياً عند كل إقلاع إن فرغت المجموعة، وشكل ثالث
 * مختلف كان في كلا الملفّين قبل هذا التوحيد). النصّ هنا نسخة حرفية من
 * `car_hero_frontend_website/src/infrastructure/locales/{ar,en}/translation.json`
 * (مفتاح `pricing`) — أي تعديل على العرض يبدأ من هناك أولاً ثم يُنسخ هنا.
 *
 * المميّزة تظهر بوثيقتين (شهري/سنوي): المخطّط لا يحمل مفهوم "دورة فوترة" على
 * وثيقة واحدة، وكل واجهة (`PlansScreen.js`) مبنية أصلاً على مقارنة وثائق
 * بمُدَد مختلفة عبر `monthlyEquivalent()`.
 */
export interface SubscriptionPlanCatalogEntry {
  /** مفتاح ثابت لا يتغيّر — عليه يقوم upsert البذرة، لا على الاسم أو السعر */
  planKey: 'free' | 'premium_monthly' | 'premium_yearly';
  name: string;
  nameAr: string;
  price: number;
  durationDays: number;
  tier: 'basic' | 'silver' | 'gold' | 'platinum';
  features: string[];
  featuresAr: string[];
  sortOrder: number;
}

const FREE_FEATURES = [
  'Basic Roadside Services',
  'Standard Reward Points',
  'Distance-based Matching',
  '1 Vehicle',
  'Standard Priority',
];
const FREE_FEATURES_AR = [
  'خدمات المساعدة الأساسية',
  'نقاط مكافآت قياسية',
  'مطابقة حسب المسافة',
  'سيارة واحدة',
  'أولوية قياسية',
];

const PREMIUM_FEATURES = [
  'Full Services (Maintenance, Wash, etc.)',
  'Double Reward Points',
  'Rating & Performance Matching',
  'Unlimited Vehicles',
  '1 Free Annual Service',
  'Highest Priority',
];
const PREMIUM_FEATURES_AR = [
  'خدمات كاملة (صيانة، غسيل، إلخ)',
  'نقاط مكافآت مضاعفة',
  'مطابقة ذكية حسب التقييم',
  'سيارات غير محدودة',
  'خدمة سنوية مجانية واحدة',
  'أولوية قصوى',
];

// السنوي بنفس ميزات الشهري تماماً — قيمته المضافة هي **التوفير** لا ميزات
// أخرى: ١٢×١٥,٠٠٠=١٨٠,٠٠٠ مقابل ١٥٠,٠٠٠ سنوياً ⇒ توفير ٣٠,٠٠٠ (شهران مجاناً).
// نُبرزه سطراً صريحاً كي لا تبدو البطاقتان متطابقتين على العميل والأدمن.
const PREMIUM_YEARLY_FEATURES = [...PREMIUM_FEATURES, 'Save 30,000 SYP a year (2 months free)'];
const PREMIUM_YEARLY_FEATURES_AR = [...PREMIUM_FEATURES_AR, 'توفير ٣٠٬٠٠٠ ل.س سنوياً (شهران مجاناً)'];

export const SUBSCRIPTION_PLAN_CATALOG: SubscriptionPlanCatalogEntry[] = [
  {
    planKey: 'free',
    name: 'Free Plan',
    nameAr: 'الباقة المجانية',
    price: 0,
    durationDays: 36500, // بلا انتهاء عملياً — لا تُشترى، هي الحالة الافتراضية
    tier: 'basic',
    features: FREE_FEATURES,
    featuresAr: FREE_FEATURES_AR,
    sortOrder: 1,
  },
  {
    planKey: 'premium_monthly',
    name: 'Premium Plan (Monthly)',
    nameAr: 'الباقة المميزة',
    price: 15000,
    durationDays: 30,
    tier: 'gold',
    features: PREMIUM_FEATURES,
    featuresAr: PREMIUM_FEATURES_AR,
    sortOrder: 2,
  },
  {
    planKey: 'premium_yearly',
    name: 'Premium Plan (Yearly)',
    nameAr: 'الباقة المميزة',
    price: 150000,
    durationDays: 365,
    tier: 'gold',
    features: PREMIUM_YEARLY_FEATURES,
    featuresAr: PREMIUM_YEARLY_FEATURES_AR,
    sortOrder: 3,
  },
];

/**
 * فئات الخدمة التي يتطلّب طلبها اشتراكاً نشطاً — «خدمات كاملة (صيانة، غسيل،
 * إلخ)» في الباقة المميزة تقابل تحديداً هاتين الفئتين من كتالوج الخدمات
 * (`service-catalog.ts`): السبع الباقية كلّها مساعدة طريق أساسية، وهي ما
 * تتضمّنه الباقة المجانية بنصّها الحرفي.
 */
export const PREMIUM_ONLY_SERVICE_CATEGORIES = ['oil', 'car_wash'] as const;
