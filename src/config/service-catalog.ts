/**
 * كتالوج Car Hero — المصدر الوحيد للخدمات التسع.
 *
 * كانت القائمة مكتوبة من جديد في كل واجهة: سبع خدمات في البذرة، وستّ في شبكة
 * الموقع، واثنتا عشرة «تخصّصاً» في نموذج تسجيل الفنّي، وتسميات عربية مختلفة في
 * كل لوحة. فظهرت الخدمة الواحدة باسمين ورمزين حسب الشاشة، وكانت كل إضافة
 * تُنفَّذ في مكان وتُنسى في الباقي.
 *
 * الترتيب هنا هو ترتيب العرض في كل مكان. `iconKey` ليس اسم مكوّن في مكتبة
 * بعينها — كل واجهة تترجمه إلى أيقونتها (lucide في الويب، phosphor في
 * التطبيقين) عبر جدولها الخاص، لأن الحزمتين لا تتشاركان الأسماء.
 */
import { ServiceCategory } from '../core/enums/status.enum';

export interface ServiceCatalogEntry {
  /** الفئة — هي معرّف الخدمة نفسه، لا وسم عليها */
  category: ServiceCategory;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  /** مفتاح محايد عن المكتبة، تترجمه كل واجهة إلى أيقونتها */
  iconKey: string;
  /** لون التمييز في الشرائح والبطاقات (hex، يعمل في الوضعين) */
  color: string;
  basePrice: number;
  /** بالدقائق */
  estimatedDuration: number;
  /** يظهر ضمن «الطوارئ» ويُعطى أولوية في التوزيع */
  isEmergency: boolean;
  /** يُعرض في شبكة الصفحة الرئيسية للموقع كمعاينة */
  featured: boolean;
  sortOrder: number;
}

export const SERVICE_CATALOG: ServiceCatalogEntry[] = [
  {
    category: ServiceCategory.TOWING,
    name: 'Towing Service',
    nameAr: 'خدمة السحب',
    description: 'Move the vehicle safely to a workshop or a location you choose.',
    descriptionAr: 'نقل السيارة بأمان إلى أقرب ورشة أو الموقع الذي تختاره.',
    iconKey: 'towing',
    color: '#2563EB',
    basePrice: 150,
    estimatedDuration: 60,
    isEmergency: true,
    featured: true,
    sortOrder: 1,
  },
  {
    category: ServiceCategory.BATTERY,
    name: 'Battery Jump Start',
    nameAr: 'تشغيل البطارية',
    description: 'Fast help when the battery is weak or the car will not start.',
    descriptionAr: 'مساعدة سريعة عند ضعف البطارية أو توقف السيارة عن العمل.',
    iconKey: 'battery',
    color: '#7C3AED',
    basePrice: 75,
    estimatedDuration: 30,
    isEmergency: true,
    featured: true,
    sortOrder: 2,
  },
  {
    category: ServiceCategory.TIRE,
    name: 'Flat Tire Change',
    nameAr: 'تغيير الإطار',
    description: 'Replace a flat tire on the road without a long wait.',
    descriptionAr: 'تبديل الإطار المثقوب على الطريق بدون انتظار طويل.',
    iconKey: 'tire',
    color: '#E11D48',
    basePrice: 80,
    estimatedDuration: 30,
    isEmergency: true,
    featured: true,
    sortOrder: 3,
  },
  {
    category: ServiceCategory.FUEL,
    name: 'Fuel Delivery',
    nameAr: 'توصيل الوقود',
    description: 'Fuel delivered when you run out so you can keep moving.',
    descriptionAr: 'وقود يصلك عند نفاده لتكمل طريقك بسرعة.',
    iconKey: 'fuel',
    color: '#F59E0B',
    basePrice: 50,
    estimatedDuration: 45,
    isEmergency: true,
    featured: true,
    sortOrder: 4,
  },
  {
    category: ServiceCategory.LOCKOUT,
    name: 'Lockout Service',
    nameAr: 'فتح الأقفال',
    description: 'Help when the car is locked or the key is left inside.',
    descriptionAr: 'مساعدة عند إغلاق السيارة أو نسيان المفتاح بداخلها.',
    iconKey: 'lockout',
    color: '#0891B2',
    basePrice: 100,
    estimatedDuration: 30,
    isEmergency: true,
    featured: true,
    sortOrder: 5,
  },
  {
    category: ServiceCategory.OIL,
    name: 'Oil Change',
    nameAr: 'تغيير الزيت',
    description: 'Essential maintenance that keeps your car ready.',
    descriptionAr: 'صيانة أساسية تحافظ على جاهزية سيارتك.',
    iconKey: 'oil',
    color: '#059669',
    basePrice: 120,
    estimatedDuration: 45,
    isEmergency: false,
    featured: true,
    sortOrder: 6,
  },
  {
    category: ServiceCategory.BREAKDOWN,
    name: 'Sudden Breakdown',
    nameAr: 'أعطال مفاجئة',
    description: 'Fast response when the car stops on the road.',
    descriptionAr: 'استجابة سريعة عند توقف السيارة على الطريق.',
    iconKey: 'breakdown',
    color: '#EA580C',
    basePrice: 90,
    estimatedDuration: 45,
    isEmergency: true,
    featured: false,
    sortOrder: 7,
  },
  {
    category: ServiceCategory.ENGINE,
    name: 'Engine Trouble',
    nameAr: 'مشاكل المحرك',
    description: 'Urgent check when smoke or warning lights appear.',
    descriptionAr: 'فحص عاجل عند ظهور دخان أو مؤشرات تحذير على اللوحة.',
    iconKey: 'engine',
    color: '#DC2626',
    basePrice: 110,
    estimatedDuration: 60,
    isEmergency: true,
    featured: false,
    sortOrder: 8,
  },
  {
    category: ServiceCategory.CAR_WASH,
    name: 'Car Wash',
    nameAr: 'غسيل السيارة',
    description: 'Full wash and detailing, at your place or on a recurring plan.',
    descriptionAr: 'غسيل وتلميع كامل، في موقعك أو ضمن خطة غسيل دورية.',
    iconKey: 'car_wash',
    color: '#0284C7',
    basePrice: 50,
    estimatedDuration: 60,
    isEmergency: false,
    featured: false,
    sortOrder: 9,
  },
];

/** الاسم العربي للفئة — يقبل الفئات المتقاعدة عبر `resolveServiceCategory`. */
export const SERVICE_CATEGORY_LABELS_AR: Record<string, string> = Object.fromEntries(
  SERVICE_CATALOG.map((entry) => [entry.category, entry.nameAr]),
);

export function findCatalogEntry(category?: string | null): ServiceCatalogEntry | undefined {
  if (!category) return undefined;
  return SERVICE_CATALOG.find((entry) => entry.category === category);
}
