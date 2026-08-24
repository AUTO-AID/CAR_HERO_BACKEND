import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IProviderRepository } from '../../domain/repositories/provider.repository.interface';
import { NotificationType, RegistrationStatus } from '../../../../core/enums/status.enum';
import { User, UserDocument } from '../../../users/infrastructure/persistence/mongoose/schemas/user.schema';
import { NotificationsService } from '../../../notifications/application/services/notifications.service';
import { notificationContent } from '../../../notifications/application/notification-content';

/**
 * اعتماد المزوّد — التنفيذ الوحيد للفعل.
 *
 * الاعتماد يمسّ **وثيقتين لا واحدة**: ملف المزوّد وحساب الدخول. والسبب أن
 * `auth.service` ينشئ حساب الفنّي بـ `isActive: false` عمداً («Providers start
 * inactive»)، و`login` و`JwtStrategy` يرفضان المعطَّل. فاعتمادُ ملف المزوّد
 * وحده كان يترك صاحبه أمام «حسابك معطّل» بينما تراه لوحة الإدارة أخضر معتمداً
 * — وهو عطل لا يظهر عند أي طرف.
 *
 * كان لهذا الفعل تنفيذان: هذا (ناقص، يمسّ الملف فقط) و`AdminProvidersService`
 * (كامل). فكان نجاح الفنّي في الدخول يتوقّف على أي زرّ ضغطت الإدارة. الآن
 * التنفيذ هنا وحده، والخدمة الإدارية تفوّض إليه.
 */
@Injectable()
export class ApproveProviderUseCase {
  private readonly logger = new Logger(ApproveProviderUseCase.name);

  constructor(
    @Inject(IProviderRepository)
    private readonly providerRepository: IProviderRepository,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async execute(id: string) {
    const provider = await this.providerRepository.updateRegistrationStatus(
      id,
      RegistrationStatus.APPROVED,
    );

    // المطابقة بالهاتف حرفية، والطرفان يُكتبان مطبَّعين الآن (`normalizeSyrianPhone`).
    const account = await this.userModel.findOneAndUpdate(
      { phoneNumber: provider.phone },
      { $set: { isActive: true } },
      { new: true },
    );

    if (!account) {
      // لا نُفشل الاعتماد: الملف اعتُمد فعلاً وإبطاله أسوأ. لكن الصمت هنا هو
      // ما جعل العطل الأصلي غير مرئي، فيُسجَّل تحذيراً صريحاً.
      this.logger.warn(
        `Provider ${id} approved but no user account matches phone ${provider.phone}; ` +
          `they will not be able to log in until an account exists for that number.`,
      );
      return { message: 'Provider approved, but no linked login account was found', provider };
    }

    try {
      await this.notificationsService.createNotification({
        recipientId: account._id.toString(),
        recipientType: 'provider',
        ...notificationContent.providerApproved(),
        type: NotificationType.INFO,
        data: {
          event: 'provider.registration.approved',
          providerId: id,
        },
      });
    } catch (error: any) {
      // الاعتماد وقع والحساب فُعّل — فشل الإشعار لا يجوز أن يتراجع عنهما.
      this.logger.error(`Approval notification failed for ${id}: ${error?.message ?? error}`);
    }

    return { message: 'Provider approved and activated successfully', provider };
  }
}
