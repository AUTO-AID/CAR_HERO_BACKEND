import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../../users/infrastructure/persistence/mongoose/schemas/user.schema';
import {
  PendingRegistration,
  PendingRegistrationDocument,
} from '../../infrastructure/persistence/mongoose/schemas/pending-registration.schema';
import { OtpUtil } from '../../../../core/utils/otp.util';
import { WhatsAppWebService } from '../../../whatsapp/application/services/whatsapp-web.service';
import { IOtpResponse } from '../../../../core/interfaces';
import { SUCCESS_MESSAGES } from '../../../../core/constants';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(PendingRegistration.name)
    private pendingRegistrationModel: Model<PendingRegistrationDocument>,
    private whatsAppService: WhatsAppWebService,
  ) {}

  /**
   * توليد وحفظ OTP وإرساله عبر WhatsApp
   */
  async generateAndSave(phoneNumber: string): Promise<void> {
    try {
      // ⚠️ DEV MODE: WhatsApp check bypassed
      // if (!this.whatsAppService.isClientReady()) {
      //   throw new InternalServerErrorException(
      //     'WhatsApp service is not ready. Please try again later.',
      //   );
      // }

      // ⚠️ DEV MODE: Fixed OTP = 123456
      const otpCode = '123456'; // OtpUtil.generate(6);
      const otpExpiresAt = OtpUtil.getExpirationTime(5);

      this.logger.log(`📝 [DEV] OTP for ${phoneNumber}: ${otpCode}`);

      // حفظ OTP في قاعدة البيانات
      const result = await this.userModel.updateOne(
        { phoneNumber },
        {
          $set: {
            otpCode,
            otpExpiresAt,
            otpAttempts: 0,
          },
        },
      );

      if (result.matchedCount === 0) {
        throw new InternalServerErrorException('User not found');
      }

      // ⚠️ DEV MODE: WhatsApp sending disabled
      // const message = this.buildOTPMessage(otpCode);
      // await this.whatsAppService.sendMessage(phoneNumber, message);

      this.logger.log(`✅ [DEV] OTP saved (not sent via WhatsApp): ${otpCode}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to generate/send OTP for ${phoneNumber}`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to send verification code. Please try again later.',
      );
    }
  }

  /**
   * بناء رسالة OTP
   */
  private buildOTPMessage(otpCode: string): string {
    return `🚗 *CarHero* 🚗

✨ أهلاً بك ✨

رمز التحقق الخاص بك هو: *${otpCode}*

⏳ الرمز صالح لمدة 5 دقائق.
🔒 لسلامتك، لا تشارك هذا الرمز مع أي شخص.`;
  }

  /**
   * إنشاء استجابة OTP
   */
  createResponse(phoneNumber: string): IOtpResponse {
    return {
      message: SUCCESS_MESSAGES.AUTH.OTP_SENT,
      phoneNumber,
      expiresIn: 300,
    };
  }

  /**
   * توليد وحفظ OTP للـ PendingRegistration وإرساله عبر WhatsApp
   */
  async generateAndSaveForPending(phoneNumber: string): Promise<void> {
    try {
      // ⚠️ DEV MODE: WhatsApp check bypassed
      // if (!this.whatsAppService.isClientReady()) {
      //   throw new InternalServerErrorException(
      //     'WhatsApp service is not ready. Please try again later.',
      //   );
      // }

      // ⚠️ DEV MODE: Fixed OTP = 123456
      const otpCode = '123456'; // OtpUtil.generate(6);
      const otpExpiresAt = OtpUtil.getExpirationTime(5);

      this.logger.log(
        `📝 [DEV] OTP for pending registration ${phoneNumber}: ${otpCode}`,
      );

      // حفظ OTP في PendingRegistration
      const result = await this.pendingRegistrationModel.updateOne(
        { phoneNumber },
        {
          $set: {
            otpCode,
            otpExpiresAt,
            otpAttempts: 0,
          },
        },
      );

      if (result.matchedCount === 0) {
        throw new InternalServerErrorException(
          'Pending registration not found',
        );
      }

      // ⚠️ DEV MODE: WhatsApp sending disabled
      // const message = this.buildOTPMessage(otpCode);
      // await this.whatsAppService.sendMessage(phoneNumber, message);

      this.logger.log(`✅ [DEV] OTP saved (not sent via WhatsApp): ${otpCode}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to generate/send OTP for pending registration ${phoneNumber}`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to send verification code. Please try again later.',
      );
    }
  }

  /**
   * التحقق من اتصال WhatsApp
   */
  async checkWhatsAppConnection(): Promise<boolean> {
    return this.whatsAppService.isClientReady();
  }
}
