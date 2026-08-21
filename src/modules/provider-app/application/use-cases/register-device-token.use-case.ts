import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Provider,
  ProviderDocument,
} from '../../../providers/infrastructure/persistence/mongoose/schemas/provider.schema';
import { User, UserDocument } from '../../../users/infrastructure/persistence/mongoose/schemas/user.schema';
import { RegisterDeviceDto } from '../dtos';
import { ProviderContext } from '../services/provider-context.service';

/**
 * تسجيل رمز الجهاز للإشعارات المدفوعة.
 *
 * يُكتب على الوثيقتين معاً (حساب المستخدم ووثيقة الفنّي): `NotificationsService`
 * يقرأ `user.fcmToken` أولاً ثم `provider.fcmToken`، وحسابات الفنّيين المُنشأة
 * من الإدارة قد لا يكون لها حساب مستخدم مرتبط أصلاً.
 */
@Injectable()
export class RegisterDeviceTokenUseCase {
  constructor(
    @InjectModel(Provider.name)
    private readonly providerModel: Model<ProviderDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async execute(context: ProviderContext, dto: RegisterDeviceDto) {
    const token = dto.token.trim();

    await Promise.all([
      this.providerModel.findByIdAndUpdate(context.providerId, { $set: { fcmToken: token } }).exec(),
      this.userModel.findByIdAndUpdate(context.userId, { $set: { fcmToken: token } }).exec(),
    ]);

    return { registered: true, platform: dto.platform ?? null };
  }
}
