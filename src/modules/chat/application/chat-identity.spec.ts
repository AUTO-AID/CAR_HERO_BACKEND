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
  const chatModelStub = (participants: string[] | null = null) => ({
    findById: jest.fn().mockReturnValue({
      select: () => ({ lean: () => ({ exec: () => Promise.resolve(participants ? { participants } : null) }) }),
    }),
  });
  const orderRepoStub = (order: any = null) => ({ findById: jest.fn().mockResolvedValue(order) });
  const makeService = (found: any, chat: any = chatModelStub(), orders: any = orderRepoStub()) =>
    new ChatIdentityService(
      { findOne: jest.fn().mockReturnValue({ exec: () => Promise.resolve(found) }) } as any,
      chat as any,
      orders as any,
    );

  it('يحترم ادّعاء التوكن حين يوجد، بلا نداء قاعدة', async () => {
    const model: any = { findOne: jest.fn() };
    const service = new ChatIdentityService(model, chatModelStub() as any, orderRepoStub() as any);

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
    const service = new ChatIdentityService(model, chatModelStub() as any, orderRepoStub() as any);

    await expect(service.resolve({ id: 'customer-1', accountType: 'customer' })).resolves.toBe('customer-1');
    expect(model.findOne).not.toHaveBeenCalled();
  });
});

/**
 * الانحدار الذي أُصلح: صاحب حساب فنّي يطلب خدمةً من **تطبيق العميل**.
 *
 * هو عميل ذلك الطلب (`order.userId` = حسابه)، لكن `resolve` كانت تُعيد وثيقة
 * مزوّده دائماً — فلا تطابق أي طرف من الطلب، ويردّ الخادم «Participants are
 * not linked to this order» على محادثةٍ هو أحد طرفيها. الهويّة تُحسم بالطلب.
 */
describe('ChatIdentityService — الهويّة تتبع الطلب لا نوع الحساب', () => {
  const PROVIDER_DOC = new Types.ObjectId().toString();
  const ACCOUNT = new Types.ObjectId().toString();
  const OTHER_PROVIDER = new Types.ObjectId().toString();
  const CHAT_ID = new Types.ObjectId().toString();
  const technician = { id: ACCOUNT, _id: ACCOUNT, accountType: 'provider', providerId: PROVIDER_DOC };

  const build = (order: any, participants: string[] | null = null) =>
    new ChatIdentityService(
      { findOne: jest.fn().mockReturnValue({ exec: () => Promise.resolve(null) }) } as any,
      {
        findById: jest.fn().mockReturnValue({
          select: () => ({ lean: () => ({ exec: () => Promise.resolve(participants ? { participants } : null) }) }),
        }),
      } as any,
      { findById: jest.fn().mockResolvedValue(order) } as any,
    );

  it('عميلاً في طلبه: يدخل بحسابه لا بوثيقة مزوّده', async () => {
    const service = build({ userId: ACCOUNT, providerId: OTHER_PROVIDER });
    await expect(service.resolveForOrder(technician, 'order-1')).resolves.toBe(ACCOUNT);
  });

  it('فنّياً في طلب آخر: يدخل بوثيقة مزوّده', async () => {
    const service = build({ userId: new Types.ObjectId().toString(), providerId: PROVIDER_DOC });
    await expect(service.resolveForOrder(technician, 'order-2')).resolves.toBe(PROVIDER_DOC);
  });

  it('غريبٌ عن الطلب: يعود السلوك القديم فيرفضه المستدعي كما كان', async () => {
    const service = build({ userId: new Types.ObjectId().toString(), providerId: OTHER_PROVIDER });
    await expect(service.resolveForOrder(technician, 'order-3')).resolves.toBe(PROVIDER_DOC);
  });

  it('المحادثة القائمة تحسم الهويّة كما يحسمها الطلب', async () => {
    const service = build(null, [ACCOUNT, OTHER_PROVIDER]);
    await expect(service.resolveForChat(technician, CHAT_ID)).resolves.toBe(ACCOUNT);
  });

  it('الهويّتان تُعرَضان معاً لقائمة المحادثات', async () => {
    const service = build(null);
    await expect(service.candidates(technician)).resolves.toEqual([PROVIDER_DOC, ACCOUNT]);
  });
});
