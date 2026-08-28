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

      if (!this.whatsAppService.isClientReady() && !this.isDevOtpFallbackAllowed()) {
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

      try {
        await this.dispatchOtp(phoneNumber, otpCode);
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

  private isDevEnvironment(): boolean {
    return (process.env.NODE_ENV || 'development') !== 'production';
  }

  /**
   * TEMPORARY (see config/dev-flags.ts): in development, when WhatsApp Web is
   * not linked, the OTP is written to the server log instead of being sent, so
   * flows that still generate an OTP remain testable. Production is unaffected.
   */
  private isDevOtpFallbackAllowed(): boolean {
    return !this.whatsAppService.isClientReady() && this.isDevEnvironment();
  }

  private async dispatchOtp(phoneNumber: string, otpCode: string): Promise<void> {
    if (this.whatsAppService.isClientReady()) {
      const message = this.buildOTPMessage(otpCode);
      try {
        await this.whatsAppService.sendMessage(phoneNumber, message);
        return;
      } catch (error) {
        /**
         * A *ready* client can still fail to send. `isReady` only flips back on
         * a `disconnected` event, and the ways WhatsApp Web actually breaks —
         * the Chromium page dying, the linked session being dropped, a protocol
         * call timing out — often never emit one. The flag then says "connected"
         * while every send throws.
         *
         * In production that has to surface: a user who never gets a code must
         * not be told the code was sent. In development it meant the opposite
         * problem — no account could be created at all, because registration was
         * gated behind a browser session unrelated to the feature being built.
         * So dev degrades to the same console fallback used when WhatsApp was
         * never linked, and says plainly why it did.
         */
        if (!this.isDevEnvironment()) throw error;
        const reason = error instanceof Error ? error.message : String(error);
        this.logger.warn(`⚠️  [DEV] WhatsApp send failed (${reason}) — falling back to the log`);
        this.logOtpToConsole(phoneNumber, otpCode);
        return;
      }
    }
    // بديل التطوير: طباعة الرمز في السجل بدل الإرسال عبر WhatsApp
    this.logger.warn(`⚠️  [DEV] WhatsApp not ready — falling back to the log`);
    this.logOtpToConsole(phoneNumber, otpCode);
  }

  private logOtpToConsole(phoneNumber: string, otpCode: string): void {
    this.logger.warn(`⚠️  [DEV] OTP for ${phoneNumber} is: ${otpCode}`);
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

      if (!this.whatsAppService.isClientReady() && !this.isDevOtpFallbackAllowed()) {
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

      try {
        await this.dispatchOtp(phoneNumber, otpCode);
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
