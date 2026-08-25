import { PaymentMethod } from '../../../../core/enums/status.enum';

/**
 * **مَن يمسك مال الطلب؟** — السؤال الذي كان الاسترجاع يتخطّاه.
 *
 * `paymentStatus = completed` تقول «سُدِّد» ولا تقول «سُدِّد **إلينا**»، والفرق
 * بينهما هو الفرق بين إعادة مالٍ نملكه وبين **طبع** مالٍ لم يصلنا:
 *
 * | الطريقة       | إلى أين ذهب المال فعلاً                    | نملك ردّه؟ |
 * |---------------|--------------------------------------------|------------|
 * | `cham_cash`   | محفظة `platform_earnings` عبر البوّابة       | نعم        |
 * | `wallet`/`online`/`card` (متقاعدة) | المنصّة — بوّابات سابقة | نعم        |
 * | `cash`        | **جيب الفنّي** عند إتمام الخدمة              | لا         |
 * | `points`      | لا مال أصلاً — خصمٌ على `payableAmount`      | لا         |
 *
 * وكان `CancelOrderUseCase` يودع `order.total` في محفظة العميل لأي طلب
 * `completed` مهما كانت طريقته. مع `cash` يعني ذلك رصيداً حقيقياً قابلاً للصرف
 * (يشتري اشتراكاً مثلاً) مقابل مالٍ لم تقبضه المنصّة قطّ — فسلسلة
 * «أنشئ طلباً ← أعلن أنك دفعت نقداً ← ألغِه» كانت تُنتج مالاً من العدم، وتتكرّر
 * بلا حدّ.
 *
 * والنقاط لا تحتاج هذا الحارس: `payableAmount` صفرٌ حين تُغطّي الطلب كاملاً،
 * فشرط `total > 0` يُقصيها أصلاً — ولها مسار ردٍّ خاصّ بها يُعيد النقاط نفسها
 * لا قيمتها نقداً.
 */
export function isPlatformHeldPayment(paymentMethod?: string): boolean {
  return PLATFORM_HELD_METHODS.has(paymentMethod as PaymentMethod);
}

const PLATFORM_HELD_METHODS = new Set<PaymentMethod>([
  PaymentMethod.CHAM_CASH,
  // المتقاعدة تُقرأ ولا تُكتب، لكن طلبات قديمة في القاعدة تحملها — وقد قبضتها
  // المنصّة فعلاً يوم كانت فعّالة، فاسترجاعها إلى المحفظة صحيح.
  PaymentMethod.WALLET,
  PaymentMethod.ONLINE,
  PaymentMethod.CARD,
]);
