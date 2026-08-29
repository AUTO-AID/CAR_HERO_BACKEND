import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Provider,
  ProviderDocument,
} from '../../providers/infrastructure/persistence/mongoose/schemas/provider.schema';
import { Chat, ChatDocument } from '../infrastructure/persistence/mongoose/schemas/chat.schema';
import { IOrderRepository } from '../../orders/domain/repositories/order.repository.interface';

/**
 * هوية الطرف داخل محادثة الطلب.
 *
 * عضوية المحادثة تُقاس بـ `[order.userId, order.providerId]`. ومعرّف المزوّد
 * هناك هو معرّف **وثيقة المزوّد**، بينما توكن الفنّي يحمل حساب المستخدم في
 * `id` ووثيقة المزوّد في `providerId`. استعمال `id` للفنّي كان يعني أحد
 * أمرين: رفضاً بـ 403، أو محادثة ثانية بزوج مشاركين مغاير لا يراها العميل.
 *
 * العميل والإداري يبقيان على `id`: لا وثيقة مزوّد لهما أصلاً.
 */
export function chatIdentityOf(user: any): string {
  const providerId = user?.providerId ? String(user.providerId) : null;
  if (providerId) return providerId;
  return accountIdOf(user);
}

/** حساب المستخدم في التوكن، بأي اسم وصل */
function accountIdOf(user: any): string {
  const id = user?.id ?? user?._id ?? user?.userId ?? user?.sub;
  return id ? String(id) : '';
}

/** حساب فنّي؟ الدور يصل باسمين حسب مُصدِر التوكن */
function isProviderAccount(user: any): boolean {
  return user?.accountType === 'provider' || user?.role === 'provider';
}

/**
 * ChatIdentityService — الهويّة نفسها في مسار HTTP ومسار المقبس.
 *
 * `chatIdentityOf` وحدها تعتمد على ادّعاء `providerId` في التوكن، وحين يغيب
 * **تتدهوّر بصمت** إلى حساب المستخدم بدل أن تُعلن الفشل. وهذا التدهور كان
 * يقع في مسار واحد فقط، وهو ما جعل العطب محيّراً:
 *
 * - HTTP: `JwtStrategy.validate` يبحث عن وثيقة المزوّد بالهاتف حين يغيب
 *   الادّعاء، فيصل `providerId` صحيحاً ⇒ فتح المحادثة وتحميل تاريخها ينجحان.
 * - WS: `WsJwtGuard` ينسخ حمولة التوكن كما هي بلا هذا الاحتياط ⇒ الهويّة
 *   تصير حساب المستخدم، فيُرفض `join_chat` و`send_message` بـ«لست مشاركاً».
 *
 * فيرى الفنّي شاشةً تُفتح ثم لا تستقبل ولا تُرسل. الاحتياط هنا مرّة واحدة
 * لكلا المسارين، ورفضٌ صريح بدل التدهور الصامت حين لا يوجد ملفّ فنّي.
 *
 * (القاعدة مطابقة لـ`ProviderContextService.findProviderDocument` الذي
 * تستعمله مسارات `/provider-app/*` — ولهذا كانت تعمل بينما المحادثة تفشل.)
 */
@Injectable()
export class ChatIdentityService {
  constructor(
    @InjectModel(Provider.name)
    private readonly providerModel: Model<ProviderDocument>,
    @InjectModel(Chat.name)
    private readonly chatModel: Model<ChatDocument>,
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
  ) {}

  /** وثيقة المزوّد لهذا الحساب إن وُجدت — بلا رمي، للاستعمال في الترشيح */
  private async providerIdOf(user: any): Promise<string> {
    const claimed = user?.providerId ? String(user.providerId) : '';
    if (claimed && Types.ObjectId.isValid(claimed)) return claimed;
    if (!isProviderAccount(user)) return '';

    const phone = user?.phoneNumber || user?.phone;
    const provider = phone ? await this.providerModel.findOne({ phone }).exec() : null;
    return provider ? provider._id.toString() : '';
  }

  async resolve(user: any): Promise<string> {
    const providerId = await this.providerIdOf(user);
    if (providerId) return providerId;
    if (isProviderAccount(user)) {
      throw new ForbiddenException('لا يوجد ملف فنّي مرتبط بهذا الحساب.');
    }
    return accountIdOf(user);
  }

  /**
   * **الهويّات التي قد يحملها هذا الحساب — لا هويّة واحدة.**
   *
   * الحساب الواحد قد يكون طرفين مختلفين: صاحب حساب فنّي يطلب خدمةً من تطبيق
   * العميل هو **عميل** ذلك الطلب (`order.userId` = حساب المستخدم)، وهو نفسه
   * **فنّي** طلبٍ آخر (`order.providerId` = وثيقة المزوّد). فالذي يحسم بأيّ
   * هويّة يدخل المحادثة هو **الطلب المعنيّ** لا نوع الحساب.
   *
   * وهذا بالضبط ما كان يكسر محادثة العميل حين يكون حسابه من نوع `provider`:
   * `resolve` تُعيد وثيقة المزوّد دائماً، فلا تطابق `order.userId` الذي هو
   * حسابه — فيردّ الخادم «Participants are not linked to this order» على
   * محادثة هو أحد طرفيها فعلاً.
   */
  async candidates(user: any): Promise<string[]> {
    const ids: string[] = [];
    const providerId = await this.providerIdOf(user);
    if (providerId) ids.push(providerId);
    const account = accountIdOf(user);
    if (account && !ids.includes(account)) ids.push(account);
    return ids;
  }

  /**
   * الهويّة التي تنتمي فعلاً إلى هذا الطرف. وحين لا تنتمي أيٌّ منها نعود إلى
   * `resolve` كي يبقى الرفض ورسالته كما كانا — الرفض شأن المستدعي لا شأننا.
   */
  async resolveAmong(user: any, allowed: Array<string | undefined | null>): Promise<string> {
    const set = new Set((allowed || []).filter(Boolean).map((id) => String(id)));
    for (const id of await this.candidates(user)) {
      if (set.has(id)) return id;
    }
    return this.resolve(user);
  }

  /** الهويّة التي يدخل بها هذا الحساب محادثةً قائمة */
  async resolveForChat(user: any, chatId: string): Promise<string> {
    if (!chatId || !Types.ObjectId.isValid(chatId)) return this.resolve(user);
    const chat = await this.chatModel.findById(chatId).select('participants').lean().exec();
    if (!chat) return this.resolve(user);
    return this.resolveAmong(user, ((chat as any).participants || []).map((p: any) => String(p)));
  }

  /** الهويّة التي يقف بها هذا الحساب على أحد طرفَي طلب */
  async resolveForOrder(user: any, orderId: string): Promise<string> {
    if (!orderId) return this.resolve(user);
    const order = await this.orderRepository.findById(orderId).catch(() => null);
    if (!order) return this.resolve(user);
    return this.resolveAmong(user, [order.userId, order.providerId]);
  }
}
