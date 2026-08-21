import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Provider,
  ProviderDocument,
} from '../../../providers/infrastructure/persistence/mongoose/schemas/provider.schema';

export interface ProviderContext {
  providerId: string;
  userId: string;
  provider: ProviderDocument;
}

/**
 * الشكل الذي تتوقّعه حالات استخدام `orders` كـ«المستخدم الحالي» (تحقّق الملكية،
 * `OrderStateMachine`، وسجلّ الحالات). بناؤه هنا يمنع تمرير وثيقة الفنّي كاملةً
 * إلى تلك الطبقة — كانت تحمل حقولاً (`role`, `status`) تصطدم بمعناها هناك.
 */
export function asOrderActor(context: ProviderContext) {
  return {
    _id: context.userId,
    id: context.userId,
    userId: context.userId,
    providerId: context.providerId,
    role: 'provider',
    accountType: 'provider',
  };
}

/**
 * ProviderContextService — «مَن هو الفنّي صاحب هذا التوكن؟»
 *
 * الـ JWT يحمل `providerId` منذ `createAuthResponse`، لكن التوكنات المُصدَرة
 * قبل ذلك لا تحمله، ولذلك يبقى البحث بالهاتف احتياطاً (نفس ما تفعله
 * `ProvidersController.getCurrentProviderId`). المصدر واحد هنا كي لا يتكرّر
 * الاحتياط في كل مسار ولا يُنسى في أحدها.
 */
@Injectable()
export class ProviderContextService {
  constructor(
    @InjectModel(Provider.name)
    private readonly providerModel: Model<ProviderDocument>,
  ) {}

  async resolve(user: any): Promise<ProviderContext> {
    const userId = String(user?._id ?? user?.userId ?? user?.id ?? '');
    if (!userId) throw new ForbiddenException('جلسة غير صالحة، يرجى تسجيل الدخول من جديد.');

    const provider = await this.findProviderDocument(user);
    if (!provider) {
      throw new NotFoundException('لا يوجد ملف فنّي مرتبط بهذا الحساب.');
    }

    // الحساب المعطَّل أو غير المعتمد يجب أن يُوقَف هنا لا عند أول فعل: دخول
    // ينجح ثم يفشل كل شيء بعده هو أسوأ من رفض واضح عند الباب.
    if (provider.isActive === false) {
      throw new ForbiddenException('حسابك غير مفعّل حالياً. يرجى التواصل مع الإدارة.');
    }
    if (!provider.isApproved) {
      throw new ForbiddenException('حسابك قيد المراجعة من الإدارة ولم يُعتمد بعد.');
    }

    return { providerId: provider._id.toString(), userId, provider };
  }

  private async findProviderDocument(user: any): Promise<ProviderDocument | null> {
    const claimed = user?.providerId ? String(user.providerId) : '';
    if (claimed && Types.ObjectId.isValid(claimed)) {
      const byId = await this.providerModel.findById(claimed).exec();
      if (byId) return byId;
    }

    const phone = user?.phoneNumber || user?.phone;
    if (!phone) return null;
    return this.providerModel.findOne({ phone }).exec();
  }
}
