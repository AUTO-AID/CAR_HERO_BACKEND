import { OrderEntity } from '../entities/order.entity';
import { orderEarningsBase } from './order-earnings-base';

const order = (fields: Record<string, any>) => fields as unknown as OrderEntity;

/**
 * أجر الفنّي يجب ألا يتغيّر بحسب مَن ضغط زرّ الإتمام.
 *
 * قبل التوحيد كان مسار «تحديث الحالة» يحسب `totalAmount || total` ومسار
 * «تأكيد العميل» يحسب `total` — و`total` يصير الصافي بعد استخدام النقاط.
 * فالطلب نفسه كان يدفع للفنّي مبلغين مختلفين.
 */
describe('orderEarningsBase', () => {
  it('pays on the gross amount, not the amount left after loyalty points', () => {
    // إجمالي ٥٠٬٠٠٠ خُصم منه ٢٠٬٠٠٠ نقاطاً: المستحقّ ٣٠٬٠٠٠ والعمل كامل
    expect(orderEarningsBase(order({ totalAmount: 50_000, payableAmount: 30_000, total: 30_000 })))
      .toBe(50_000);
  });

  it('gives the same answer for both completion paths on the same order', () => {
    const o = order({ totalAmount: 50_000, payableAmount: 0, total: 0 });
    // المساران يناديان الدالة نفسها؛ الاختبار يثبّت أن نتيجتها واحدة مهما
    // كان الحقل الذي كان كل مسار يقرؤه سابقاً
    expect(orderEarningsBase(o)).toBe(50_000);
  });

  it('falls back to total when the order predates totalAmount', () => {
    expect(orderEarningsBase(order({ total: 18_000 }))).toBe(18_000);
  });

  it('returns zero rather than NaN for a malformed amount', () => {
    expect(orderEarningsBase(order({ totalAmount: 'abc', total: undefined }))).toBe(0);
    expect(orderEarningsBase(order({}))).toBe(0);
  });

  it('treats an explicit zero gross as a free order, not a missing field', () => {
    // `??` لا `||`: الصفر قيمة **مقروءة**. طلبٌ إجماليه صفر صراحةً مجّانيّ،
    // وأجره صفر — والقفز منه إلى `total` كان سيدفع للفنّي عن طلب بلا قيمة.
    expect(orderEarningsBase(order({ totalAmount: 0, total: 9_000 }))).toBe(0);
    expect(orderEarningsBase(order({ totalAmount: 0, total: 0 }))).toBe(0);
  });

  it('reads total only when totalAmount is absent, not when it is zero', () => {
    expect(orderEarningsBase(order({ totalAmount: undefined, total: 9_000 }))).toBe(9_000);
    expect(orderEarningsBase(order({ totalAmount: null, total: 9_000 }))).toBe(9_000);
  });
});
