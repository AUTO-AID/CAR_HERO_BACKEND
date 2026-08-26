import { ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { chatIdentityOf, ChatIdentityService } from './chat-identity';

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

/**
 * انحدار: شاشة المحادثة عند الفنّي كانت تُفتح ثم لا تُرسل ولا تستقبل.
 *
 * السبب لاتناظرٌ بين المسارين: `JwtStrategy` (HTTP) يبحث عن وثيقة المزوّد
 * بالهاتف حين يغيب ادّعاء `providerId` من التوكن، بينما `WsJwtGuard` ينسخ
 * الحمولة كما هي. فتنجح نداءات HTTP (فتح المحادثة وتحميل تاريخها) وتُرفض
 * أحداث المقبس (`join_chat` · `send_message`) بـ«لست مشاركاً» — لأن الهويّة
 * تدهورت بصمت إلى حساب المستخدم بدل وثيقة المزوّد.
 */
describe('ChatIdentityService', () => {
  const PROVIDER_DOC = new Types.ObjectId().toString();
  const makeService = (found: any) =>
    new ChatIdentityService({ findOne: jest.fn().mockReturnValue({ exec: () => Promise.resolve(found) }) } as any);

  it('يحترم ادّعاء التوكن حين يوجد، بلا نداء قاعدة', async () => {
    const model: any = { findOne: jest.fn() };
    const service = new ChatIdentityService(model);

    await expect(service.resolve({ id: 'user-account', providerId: PROVIDER_DOC })).resolves.toBe(PROVIDER_DOC);
    expect(model.findOne).not.toHaveBeenCalled();
  });

  it('يحلّ وثيقة المزوّد بالهاتف حين يغيب الادّعاء — هنا كان العطب', async () => {
    const service = makeService({ _id: new Types.ObjectId(PROVIDER_DOC) });

    await expect(
      service.resolve({ id: 'user-account', accountType: 'provider', phoneNumber: '+963900000001' }),
    ).resolves.toBe(PROVIDER_DOC);
  });

  it('يقبل الدور باسمه الآخر (role) كما يصل من بعض التوكنات', async () => {
    const service = makeService({ _id: new Types.ObjectId(PROVIDER_DOC) });

    await expect(service.resolve({ id: 'u', role: 'provider', phone: '+963900000001' })).resolves.toBe(PROVIDER_DOC);
  });

  it('يرفض صراحةً بدل التدهور الصامت حين لا ملفّ فنّي', async () => {
    const service = makeService(null);

    await expect(
      service.resolve({ id: 'user-account', accountType: 'provider', phoneNumber: '+963900000009' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('لا يمسّ العميل: حسابه هويّته بلا نداء قاعدة', async () => {
    const model: any = { findOne: jest.fn() };
    const service = new ChatIdentityService(model);

    await expect(service.resolve({ id: 'customer-1', accountType: 'customer' })).resolves.toBe('customer-1');
    expect(model.findOne).not.toHaveBeenCalled();
  });
});
