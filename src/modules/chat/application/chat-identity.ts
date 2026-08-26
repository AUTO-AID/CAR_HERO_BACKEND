import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Provider,
  ProviderDocument,
} from '../../providers/infrastructure/persistence/mongoose/schemas/provider.schema';

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
  ) {}

  async resolve(user: any): Promise<string> {
    const claimed = user?.providerId ? String(user.providerId) : '';
    if (claimed && Types.ObjectId.isValid(claimed)) return claimed;

    // العميل والإداري: حسابهما هو هويّتهما، بلا نداء قاعدة
    if (!isProviderAccount(user)) return chatIdentityOf(user);

    const phone = user?.phoneNumber || user?.phone;
    const provider = phone ? await this.providerModel.findOne({ phone }).exec() : null;
    if (!provider) {
      throw new ForbiddenException('لا يوجد ملف فنّي مرتبط بهذا الحساب.');
    }
    return provider._id.toString();
  }
}
