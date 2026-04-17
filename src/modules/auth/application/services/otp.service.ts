import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../users/infrastructure/persistence/mongoose/schemas/user.schema';
import {
  PendingRegistration,
  PendingRegistrationDocument,
} from '../schemas/pending-registration.schema';
import { OtpUtil } from '../../../../core/utils/otp.util';
import { WhatsAppWebService } from '../../whatsapp/services/whatsapp-web.service';
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
      // 1. التحقق من جاهزية WhatsApp
      if (!this.whatsAppService.isClientReady()) {
        throw new InternalServerErrorException(
          'WhatsApp service is not ready. Please try again later.',
        );
      }

      // 2. توليد OTP
      const otpCode = OtpUtil.generate(6);
      const otpExpiresAt = OtpUtil.getExpirationTime(5);

      this.logger.log(`📝 Generated OTP for ${phoneNumber}: ${otpCode}`);

      // 3. حفظ OTP في قاعدة البيانات
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

      // 4. بناء الرسالة
      const message = this.buildOTPMessage(otpCode);

      // 5. إرسال OTP عبر WhatsApp
      await this.whatsAppService.sendMessage(phoneNumber, message);

      this.logger.log(`✅ OTP sent successfully to ${phoneNumber}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to generate/send OTP for ${phoneNumber}`,
        error,
      );

      if (error.message?.includes('not ready')) {
        throw error;
      }

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
      // 1. التحقق من جاهزية WhatsApp
      if (!this.whatsAppService.isClientReady()) {
        throw new InternalServerErrorException(
          'WhatsApp service is not ready. Please try again later.',
        );
      }

      // 2. توليد OTP
      const otpCode = OtpUtil.generate(6);
      const otpExpiresAt = OtpUtil.getExpirationTime(5);

      this.logger.log(
        `📝 Generated OTP for pending registration ${phoneNumber}: ${otpCode}`,
      );

      // 3. حفظ OTP في PendingRegistration
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

      // 4. بناء الرسالة
      const message = this.buildOTPMessage(otpCode);

      // 5. إرسال OTP عبر WhatsApp
      await this.whatsAppService.sendMessage(phoneNumber, message);

      this.logger.log(`✅ OTP sent successfully to ${phoneNumber}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to generate/send OTP for pending registration ${phoneNumber}`,
        error,
      );

      if (error.message?.includes('not ready')) {
        throw error;
      }

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
