import {
  Injectable,
  BadRequestException,
  HttpException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  User,
  UserDocument,
} from '../../../users/infrastructure/persistence/mongoose/schemas/user.schema';
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
      const user = await this.userModel
        .findOne({ phoneNumber })
        .select('+otpExpiresAt');
      if (user && user.otpExpiresAt) {
        const timeRemainingMs = user.otpExpiresAt.getTime() - Date.now();
        // Since OTP is valid for 5 mins, if time remaining > 3 mins, less than 2 mins have passed
        if (timeRemainingMs > 3 * 60 * 1000) {
          throw new InternalServerErrorException(
            'Please wait 2 minutes before requesting a new code',
          );
        }
      }

      if (!this.whatsAppService.isClientReady()) {
        throw new InternalServerErrorException(
          'WhatsApp service is not ready. Please try again later.',
        );
      }

      const otpCode = OtpUtil.generate(6);
      const otpExpiresAt = OtpUtil.getExpirationTime(5);

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

      const message = this.buildOTPMessage(otpCode);
      try {
        await this.whatsAppService.sendMessage(phoneNumber, message);
      } catch (sendError) {
        await this.userModel.updateOne(
          { phoneNumber },
          {
            $set: {
              otpCode: null,
              otpExpiresAt: null,
              otpAttempts: 0,
            },
          },
        );
        throw sendError;
      }

      this.logger.log(`OTP sent successfully to ${phoneNumber}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to generate/send OTP for ${phoneNumber}`,
        error,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      if (
        error instanceof Error &&
        error.message === 'Phone number is not registered on WhatsApp'
      ) {
        throw new BadRequestException('Phone number is not registered on WhatsApp');
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
    return `CarHero verification code: *${otpCode}*

This code is valid for 5 minutes.
Do not share it with anyone.`;
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
      const pending = await this.pendingRegistrationModel
        .findOne({ phoneNumber })
        .select('+otpExpiresAt');
      if (pending && pending.otpExpiresAt) {
        const timeRemainingMs = pending.otpExpiresAt.getTime() - Date.now();
        // Since OTP is valid for 5 mins, if time remaining > 3 mins, less than 2 mins have passed
        if (timeRemainingMs > 3 * 60 * 1000) {
          throw new InternalServerErrorException(
            'Please wait 2 minutes before requesting a new code',
          );
        }
      }

      if (!this.whatsAppService.isClientReady()) {
        throw new InternalServerErrorException(
          'WhatsApp service is not ready. Please try again later.',
        );
      }

      const otpCode = OtpUtil.generate(6);
      const otpExpiresAt = OtpUtil.getExpirationTime(5);

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

      const message = this.buildOTPMessage(otpCode);
      try {
        await this.whatsAppService.sendMessage(phoneNumber, message);
      } catch (sendError) {
        await this.pendingRegistrationModel.updateOne(
          { phoneNumber },
          {
            $set: {
              otpCode: null,
              otpExpiresAt: null,
              otpAttempts: 0,
            },
          },
        );
        throw sendError;
      }

      this.logger.log(
        `OTP sent successfully to pending registration ${phoneNumber}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to generate/send OTP for pending registration ${phoneNumber}`,
        error,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      if (
        error instanceof Error &&
        error.message === 'Phone number is not registered on WhatsApp'
      ) {
        throw new BadRequestException('Phone number is not registered on WhatsApp');
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
