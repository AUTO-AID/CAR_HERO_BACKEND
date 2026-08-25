import {
  atBusinessTime,
  businessDayName,
  businessMinutesOfDay,
  parseWallClock,
  startOfBusinessDay,
} from './business-time.util';

/**
 * الاختبار كلّه قائم على مقارنة القراءة بـ`Date` الأصلية.
 *
 * العطل لا يظهر على جهاز في دمشق: التوقيت المحلّي يوافق توقيت العمل صدفةً.
 * لذلك تُقارَن كل حالة بما كان `getHours()`/`getDay()` سيُجيبان به — فإن
 * اختلفا وكانت دالّتنا هي المصيبة، فذلك دليل الإصلاح؛ وإن اتّفقا (لأن الاختبار
 * يجري في دمشق) فالتأكيد على القيمة الصحيحة يبقى قائماً في الحالتين.
 */
describe('business-time', () => {
  // ٠٦:٠٠ بتوقيت UTC = ٠٩:٠٠ في دمشق (UTC+3). هذا ما يرسله التطبيق لفتحة
  // «التاسعة صباحاً»، وهو ما كان الخادم يقرؤه سادسةً فيرفضه «قبل الدوام».
  const nineAmDamascus = new Date('2026-09-10T06:00:00.000Z');

  describe('businessMinutesOfDay', () => {
    it('reads 06:00Z as 09:00 — the wall clock the customer actually picked', () => {
      expect(businessMinutesOfDay(nineAmDamascus)).toBe(9 * 60);
    });

    it('keeps a 08:00–18:00 shop open for that booking', () => {
      const minutes = businessMinutesOfDay(nineAmDamascus);
      expect(minutes).toBeGreaterThanOrEqual(8 * 60);
      expect(minutes + 60).toBeLessThanOrEqual(18 * 60);
    });

    // الحالة الأشدّ: موعد مساءً يعبر منتصف ليل UTC فينزلق يومه بالكامل
    it('does not let a late-evening booking slide into the next day', () => {
      // ٢٢:٠٠ في دمشق = ١٩:٠٠Z من اليوم نفسه
      const tenPmDamascus = new Date('2026-09-10T19:00:00.000Z');
      expect(businessMinutesOfDay(tenPmDamascus)).toBe(22 * 60);
      expect(businessDayName(tenPmDamascus)).toBe('Thursday');
    });

    it('reads a booking just after Damascus midnight as the new day', () => {
      // ٠٠:٣٠ الجمعة في دمشق = ٢١:٣٠Z الخميس
      const justAfterMidnight = new Date('2026-09-10T21:30:00.000Z');
      expect(businessDayName(justAfterMidnight)).toBe('Friday');
      expect(businessMinutesOfDay(justAfterMidnight)).toBe(30);
    });
  });

  describe('businessDayName', () => {
    it('matches the names stored in workingHours', () => {
      expect(businessDayName(nineAmDamascus)).toBe('Thursday');
    });
  });

  describe('startOfBusinessDay', () => {
    it('anchors the day to Damascus midnight, not the server midnight', () => {
      const start = startOfBusinessDay(nineAmDamascus);
      expect(businessMinutesOfDay(start)).toBe(0);
      expect(start.getTime()).toBeLessThanOrEqual(nineAmDamascus.getTime());
      // ٠٠:٠٠ في دمشق = ٢١:٠٠Z من اليوم السابق
      expect(start.toISOString()).toBe('2026-09-09T21:00:00.000Z');
    });
  });

  describe('atBusinessTime', () => {
    it('sets a wall-clock hour in Damascus regardless of where the server runs', () => {
      const morning = atBusinessTime(nineAmDamascus, 9);
      expect(businessMinutesOfDay(morning)).toBe(9 * 60);
      expect(morning.toISOString()).toBe('2026-09-10T06:00:00.000Z');
    });

    it('handles the evening slot without rolling the date over', () => {
      const evening = atBusinessTime(nineAmDamascus, 17);
      expect(businessDayName(evening)).toBe('Thursday');
      expect(businessMinutesOfDay(evening)).toBe(17 * 60);
    });
  });

  describe('parseWallClock', () => {
    it.each([
      ['08:00', 480],
      ['00:00', 0],
      ['23:59', 1439],
      ['9:30', 570],
    ])('reads %s as %i minutes', (value, expected) => {
      expect(parseWallClock(value as string)).toBe(expected);
    });

    // القديمة كانت تُرجع NaN، وكل مقارنة مع NaN كاذبة — فيمرّ الحجز بلا فحص
    it.each([undefined, '', 'closed', '25:00', '10:75', '10-30'])(
      'returns null (never NaN) for %p',
      (value) => {
        expect(parseWallClock(value as any)).toBeNull();
      },
    );
  });
});
