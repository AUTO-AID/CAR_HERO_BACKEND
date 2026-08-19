import { notificationContent, orderStatusLabel, serviceLabel } from './notification-content';
import { OrderStatus } from '../../../core/enums/status.enum';

/**
 * الغرض: منع عودة النصوص الإنجليزية والقيم الخام إلى الإشعارات. كان التطبيق
 * عربياً بالكامل بينما كل إشعار يتولّد بالإنجليزية مع حالة خام
 * ("status changed to in_progress") واسم خدمة "undefined".
 */
const LATIN_WORDS =
  /\b(order|status|new|message|your|is now|changed|undefined|null|booked|scheduled|welcome|registration|approved|unfortunately)\b/i;
const ARABIC = /[ء-ي]/;

function expectArabicOnly(content: { title: string; body: string }) {
  expect(ARABIC.test(content.title)).toBe(true);
  expect(ARABIC.test(content.body)).toBe(true);
  expect(LATIN_WORDS.test(content.title)).toBe(false);
  expect(LATIN_WORDS.test(content.body)).toBe(false);
  expect(content.body).not.toMatch(/undefined|NaN|Invalid Date/);
}

describe('notification-content', () => {
  describe('orderStatusLabel', () => {
    it('يعرّب كل حالة في OrderStatus ولا يُعيد القيمة الخام', () => {
      Object.values(OrderStatus).forEach((status) => {
        const label = orderStatusLabel(status);
        expect(ARABIC.test(label)).toBe(true);
        expect(label).not.toBe(status);
      });
    });

    it('لا يسرّب قيمة خام لحالة مجهولة أو غائبة', () => {
      expect(orderStatusLabel('some_future_status')).toBe('حالة غير معروفة');
      expect(orderStatusLabel(undefined)).toBe('غير محددة');
    });
  });

  describe('serviceLabel', () => {
    it('يستبدل الاسم الغائب بنص عربي بدل undefined', () => {
      expect(serviceLabel(undefined)).toBe('الخدمة المطلوبة');
      expect(serviceLabel('')).toBe('الخدمة المطلوبة');
      expect(serviceLabel('   ')).toBe('الخدمة المطلوبة');
      expect(serviceLabel('خدمة السحب')).toBe('خدمة السحب');
    });
  });

  describe('newOrderForProvider', () => {
    it('لا يكرّر كلمة «خدمة» عندما يبدأ الاسم بها', () => {
      expect(notificationContent.newOrderForProvider('CH-1', 'خدمة السحب').body).toBe(
        'وصلك طلب جديد رقم CH-1 لـخدمة السحب',
      );
    });

    it('يضيف البادئة عندما لا يبدأ الاسم بـ«خدمة»', () => {
      expect(notificationContent.newOrderForProvider('CH-1', 'تبديل إطار').body).toBe(
        'وصلك طلب جديد رقم CH-1 لخدمة تبديل إطار',
      );
    });

    it('يبقى سليماً عند غياب اسم الخدمة', () => {
      const { body } = notificationContent.newOrderForProvider('CH-1', undefined);
      expect(body).not.toMatch(/undefined/);
      expect(body).toContain('الخدمة المطلوبة');
    });
  });

  describe('orderStatusChanged', () => {
    it('يعرض التسمية العربية لا الحالة الخام', () => {
      const { body } = notificationContent.orderStatusChangedForUser('CH-1', OrderStatus.IN_PROGRESS);
      expect(body).toContain('قيد التنفيذ');
      expect(body).not.toContain('in_progress');
    });
  });

  describe('recurringWashBooked', () => {
    it('لا ينتج Invalid Date من قيمة تالفة أو غائبة', () => {
      expect(notificationContent.recurringWashBooked('not-a-date').body).toContain('موعد غير محدد');
      expect(notificationContent.recurringWashBooked(undefined).body).toContain('موعد غير محدد');
    });

    it('يعرض التاريخ منسّقاً لا بصيغة ISO', () => {
      const { body } = notificationContent.recurringWashBooked(new Date('2026-08-20T14:00:00Z'));
      expect(body).not.toMatch(/\d{4}-\d{2}-\d{2}T/);
      expect(body).not.toMatch(/Invalid|undefined/);
    });
  });

  describe('كل النصوص التي تصل المستخدم', () => {
    const cases: Array<[string, { title: string; body: string }]> = [
      ['حالة الطلب للعميل', notificationContent.orderStatusChangedForUser('CH-1', OrderStatus.IN_PROGRESS)],
      ['حالة الطلب للمزوّد', notificationContent.orderStatusChangedForProvider('CH-1', OrderStatus.COMPLETED)],
      ['طلب جديد', notificationContent.newOrderForProvider('CH-1', 'خدمة السحب')],
      ['إسناد طلب', notificationContent.orderAssignedToProvider('CH-1')],
      ['رسالة جديدة', notificationContent.newChatMessage('مرحبا')],
      ['تسجيل مزوّد معلّق', notificationContent.providerRegistrationPending('ورشة الوفاء')],
      ['قبول مزوّد', notificationContent.providerApproved()],
      ['رفض مزوّد بسبب', notificationContent.providerRejected('أوراق ناقصة')],
      ['رفض مزوّد بلا سبب', notificationContent.providerRejected(undefined)],
      ['غسيل دوري', notificationContent.recurringWashBooked(new Date('2026-08-20T14:00:00Z'))],
    ];

    it.each(cases)('%s — عربي وخالٍ من الإنجليزية', (_label, content) => {
      expectArabicOnly(content);
    });
  });
});
