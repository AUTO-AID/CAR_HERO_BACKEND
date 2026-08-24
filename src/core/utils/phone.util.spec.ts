import { normalizeSyrianPhone, SYRIAN_PHONE_PATTERN } from './phone.util';

/**
 * هذه الدالة هي مفتاح الربط بين `users` و`providers`. كل مسار في تطبيق الفنّي
 * يمرّ عبر `findOne({ phone: user.phoneNumber })` — مطابقة نصّية حرفية — فأي
 * صيغتين لا تلتقيان هنا تعنيان فنّياً يدخل بنجاح ثم يفشل عنده كل شيء.
 */
describe('normalizeSyrianPhone', () => {
  it('converts the local 09 form to E.164', () => {
    expect(normalizeSyrianPhone('0991234567')).toBe('+963991234567');
  });

  it('adds the missing plus to a 963 prefix', () => {
    expect(normalizeSyrianPhone('963991234567')).toBe('+963991234567');
  });

  it('leaves an already-normalised number untouched', () => {
    expect(normalizeSyrianPhone('+963991234567')).toBe('+963991234567');
  });

  /** ما يكتبه صاحب الورشة في نموذج الموقع فعلاً */
  it('ignores spaces, dashes and parentheses', () => {
    expect(normalizeSyrianPhone('099 123 45 67')).toBe('+963991234567');
    expect(normalizeSyrianPhone('+963-99-123-4567')).toBe('+963991234567');
    expect(normalizeSyrianPhone('(0991) 234 567')).toBe('+963991234567');
  });

  /**
   * الصيغ المجهولة تُعاد كما هي لا مشوّهة: عندها يرفضها `@Matches` برسالة
   * مفهومة بدل أن تُخزَّن رقماً خاطئاً يبدو سليماً.
   */
  it('returns unrecognised input unchanged so validation can reject it', () => {
    expect(normalizeSyrianPhone('12345')).toBe('12345');
    expect(normalizeSyrianPhone('+9715012345678')).toBe('+9715012345678');
  });

  it('survives null and undefined without throwing', () => {
    expect(normalizeSyrianPhone(null as any)).toBe('');
    expect(normalizeSyrianPhone(undefined as any)).toBe('');
  });

  it('produces output the storage pattern accepts', () => {
    for (const input of ['0991234567', '963991234567', '+963 99 123 4567']) {
      expect(SYRIAN_PHONE_PATTERN.test(normalizeSyrianPhone(input))).toBe(true);
    }
  });

  it('rejects a landline-length or truncated number', () => {
    expect(SYRIAN_PHONE_PATTERN.test(normalizeSyrianPhone('099123456'))).toBe(false);
  });
});
