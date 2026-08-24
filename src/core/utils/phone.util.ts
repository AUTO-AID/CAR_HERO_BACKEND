/**
 * تطبيع رقم الهاتف السوري إلى صيغة E.164 واحدة.
 *
 * الرقم هو **مفتاح الربط** بين `users` و`providers`: كل مسار في تطبيق الفنّي
 * يمرّ عبر `providerModel.findOne({ phone: user.phoneNumber })` — مطابقة نصّية
 * حرفية. وكان كل جدول يكتبه بعقد مختلف: `users.phoneNumber` مقيَّد بـ
 * `+963XXXXXXXXX`، و`providers.phone` بلا قيد إطلاقاً. فيدخل الفنّي بنجاح ثم
 * يفشل كل `/provider-app/*` برسالة «لا يوجد ملف فنّي مرتبط بهذا الحساب» — بلا
 * عطل ظاهر في أيّ من الطرفين.
 *
 * لهذا يبقى التطبيع دالّة واحدة مشتركة: نسخة ثانية بقاعدة مختلفة تعيد الفجوة
 * ذاتها من باب آخر.
 */
export function normalizeSyrianPhone(phoneNumber: string): string {
  const digits = String(phoneNumber || '').replace(/[^\d]/g, '');

  if (/^09\d{8}$/.test(digits)) {
    return `+963${digits.slice(1)}`;
  }

  if (/^9639\d{8}$/.test(digits)) {
    return `+${digits}`;
  }

  // غير معروف الصيغة: يُعاد كما هو ليرفضه التحقّق برسالة مفهومة بدل أن
  // يُخزَّن مشوّهاً بصمت.
  return String(phoneNumber || '').trim();
}

/** الصيغة المخزَّنة الوحيدة المقبولة — يشترك فيها التحقّق في الجدولين */
export const SYRIAN_PHONE_PATTERN = /^\+963\d{9}$/;
