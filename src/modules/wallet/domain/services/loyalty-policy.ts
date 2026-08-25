/**
 * سياسة نقاط الولاء — **الطرفان في موضع واحد**.
 *
 * كان في النظام نصفُ اقتصاد: `RedeemLoyaltyPointsUseCase` يخصم النقاط ويحوّلها
 * خصماً على الطلب، **ولا سطر واحد في المنظومة كلّها يمنح نقطة**. مسحُ
 * `loyaltyPoints` يُظهر ثلاثة مواضع فقط: خصمٌ عند الاستبدال، وردٌّ عند الإلغاء.
 *
 * فالرصيد لا يملأ أبداً: شاشة «استبدال النقاط» تعرض صفراً دائماً، وكل محاولة
 * تُردّ بـ«Insufficient loyalty points balance» — ميزةٌ كاملة في التطبيق لا
 * يمكن أن تعمل ولو مرّة.
 */

/**
 * قيمة النقطة الواحدة بالعملة عند الاستبدال.
 *
 * مثبتة أيضاً في التطبيق (`car-hero-app/src/services/walletApi.js`)، والرقمان
 * يجب أن يبقيا متطابقين وإلا رأى العميل خصماً غير الذي يقع.
 */
export const LOYALTY_POINT_VALUE = 0.05;

/** المعدّل الافتراضي حين لا يضبط الإعداد الإداري غيره — نقاط لكل وحدة عملة */
export const DEFAULT_LOYALTY_POINTS_RATE = 0.2;

/** مفتاح الإعداد الإداري الذي يضبط المعدّل */
export const LOYALTY_POINTS_RATE_SETTING = 'loyalty_points_rate';

/**
 * نقاطٌ تُمنح على مبلغٍ مدفوع.
 *
 * `0.2` نقطة لكل ليرة تعني عشرين نقطة لكل مئة — وبقيمة النقطة أعلاه فذلك
 * **استرداد ١٪** من قيمة الطلب. المعدّل إعدادٌ إداري لا رقمٌ محفور، فتغييره
 * لا يحتاج نشراً.
 *
 * `floor` لا `round`: النقطة وحدة غير قابلة للتجزئة، والتقريب لأعلى يمنح
 * نقطة لم تُكتسب في كل طلب صغير.
 */
export function pointsEarnedOn(paidAmount: number, rate: number): number {
  if (!Number.isFinite(paidAmount) || paidAmount <= 0) return 0;
  if (!Number.isFinite(rate) || rate <= 0) return 0;
  return Math.floor(paidAmount * rate);
}

/** قيمة النقاط بالعملة — للعرض وللقيد المحاسبي */
export function pointsToCurrency(points: number): number {
  return Math.round(points * LOYALTY_POINT_VALUE * 100) / 100;
}

/** يقرأ معدّل المنح من قيمة إعدادٍ خام، ويردّ الفاسد إلى الافتراضي */
export function resolveLoyaltyRate(rawValue: unknown): number {
  const parsed = Number(rawValue ?? DEFAULT_LOYALTY_POINTS_RATE);
  // سالبٌ يسحب النقاط بدل منحها، والصفر يُعطّل المنح صامتاً — كلاهما لا يُقصد
  // من إعدادٍ اسمه «معدّل المنح». والسقف يحمي من خطأ كتابة (20 بدل 0.2) يمنح
  // مئة ضعف ما يُراد.
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 10) {
    return DEFAULT_LOYALTY_POINTS_RATE;
  }
  return parsed;
}
