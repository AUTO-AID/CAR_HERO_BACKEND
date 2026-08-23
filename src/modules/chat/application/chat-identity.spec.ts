import { chatIdentityOf } from './chat-identity';

/**
 * عضوية المحادثة تُفحص بـ `[order.userId, order.providerId]`.
 *
 * لو أخذنا `id` من توكن الفنّي (حساب المستخدم) بدل `providerId` (وثيقة
 * المزوّد) لوقع أحد أمرين: رفض بـ 403، أو محادثة ثانية بزوج مشاركين مغاير
 * لا يراها العميل — فيكتب كلٌّ منهما في مكان ويظنّ الآخر لا يردّ.
 */
describe('chatIdentityOf', () => {
  it('uses the provider document id for a technician token', () => {
    expect(chatIdentityOf({ id: 'user-account', _id: 'user-account', providerId: 'provider-doc' }))
      .toBe('provider-doc');
  });

  it('uses the account id for a customer token', () => {
    expect(chatIdentityOf({ id: 'customer-1', _id: 'customer-1' })).toBe('customer-1');
  });

  it('ignores an empty providerId rather than returning it', () => {
    expect(chatIdentityOf({ id: 'customer-1', providerId: null })).toBe('customer-1');
    expect(chatIdentityOf({ id: 'customer-1', providerId: '' })).toBe('customer-1');
  });

  it('normalises an ObjectId-like value to a string', () => {
    const oid = { toString: () => 'provider-doc' };
    expect(chatIdentityOf({ id: 'user-account', providerId: oid })).toBe('provider-doc');
  });

  it('falls back through the payload aliases', () => {
    expect(chatIdentityOf({ userId: 'u-1' })).toBe('u-1');
    expect(chatIdentityOf({ sub: 'u-2' })).toBe('u-2');
  });

  it('returns an empty string rather than "undefined" for a missing user', () => {
    // نصّ «undefined» كان سيُمرَّر إلى `new Types.ObjectId` فيرمي خطأً غامضاً
    expect(chatIdentityOf(null)).toBe('');
    expect(chatIdentityOf({})).toBe('');
  });
});
