import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument } from '../../../users/infrastructure/persistence/mongoose/schemas/user.schema';
import { Provider, ProviderDocument } from '../../../providers/infrastructure/persistence/mongoose/schemas/provider.schema';
import {
  PendingRegistration,
  PendingRegistrationDocument,
} from '../../infrastructure/persistence/mongoose/schemas/pending-registration.schema';

import {
  RegisterDto,
  LoginDto,
  VerifyOtpDto,
  ResetPasswordDto,
  ForgotPasswordDto,
} from '../dtos';

import {
  IAuthResponse,
  IOtpResponse,
  IJwtPayload,
} from '../../../../core/interfaces';

import {
  PasswordUtil,
  TokenUtil,
  OtpUtil,
  SanitizeUtil,
} from '../../../../core/utils';

import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../../../core/constants';
import { OtpService } from './otp.service';
import { Logout, LogoutDocument } from '../../infrastructure/persistence/mongoose/schemas/logout.schema';
import { NotificationsService } from '../../../notifications/application/services/notifications.service';
import { NotificationType } from '../../../../core/enums/status.enum';
import { Admin, AdminDocument } from '../../../admin/infrastructure/persistence/mongoose/schemas/admin.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Provider.name) private providerModel: Model<ProviderDocument>,
    @InjectModel(Logout.name) private logoutModel: Model<LogoutDocument>,
    @InjectModel(PendingRegistration.name)
    private pendingRegistrationModel: Model<PendingRegistrationDocument>,
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private otpService: OtpService,
    private notificationsService: NotificationsService,
  ) {}

  // ===========================================
  // REGISTER
  // ===========================================
  async register(registerDto: RegisterDto): Promise<IOtpResponse> {
    const { password, fullName, accountType, isTermsAccepted } =
      registerDto;
    const phoneNumber = this.normalizeSyrianPhoneNumber(registerDto.phoneNumber);

    const existingUser = await this.userModel.findOne({ phoneNumber });
    if (existingUser) {
      throw new ConflictException(ERROR_MESSAGES.USER.ALREADY_EXISTS);
    }

    const hashedPassword = await PasswordUtil.hash(password);

    // Enforce accountType safety to prevent privilege escalation
    const finalAccountType = accountType === 'provider' ? 'provider' : 'customer';

    await this.pendingRegistrationModel.findOneAndUpdate(
      { phoneNumber },
      {
        fullName,
        phoneNumber,
        password: hashedPassword,
        accountType: finalAccountType,
        isTermsAccepted,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
      { upsert: true, new: true },
    );

    await this.otpService.generateAndSaveForPending(phoneNumber);

    return this.otpService.createResponse(phoneNumber);
  }

  // ===========================================
  // WHATSAPP CONNECTION CHECK (delegates to OtpService)
  // ===========================================
  async checkWhatsAppConnection(): Promise<boolean> {
    return this.otpService.checkWhatsAppConnection();
  }

  // ===========================================
  // VERIFY OTP
  // ===========================================
  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<IAuthResponse> {
    const { otpCode } = verifyOtpDto;
    const phoneNumber = this.normalizeSyrianPhoneNumber(verifyOtpDto.phoneNumber);

    const pendingRegistration = await this.pendingRegistrationModel
      .findOne({ phoneNumber })
      .select('+otpCode +otpExpiresAt +otpAttempts +password');

    if (!pendingRegistration) {
      throw new NotFoundException(
        'Registration not found or expired. Please register again.',
      );
    }

    await this.validatePendingOtp(pendingRegistration, otpCode);

    const existingUser = await this.userModel.findOne({ phoneNumber });
    if (existingUser) {
      await this.pendingRegistrationModel.deleteOne({ phoneNumber });
      throw new ConflictException(ERROR_MESSAGES.USER.ALREADY_EXISTS);
    }

    const user = await this.userModel.create({
      fullName: pendingRegistration.fullName,
      phoneNumber: pendingRegistration.phoneNumber,
      password: pendingRegistration.password,
      accountType: pendingRegistration.accountType,
      isTermsAccepted: pendingRegistration.isTermsAccepted,
      isVerified: true,
      isActive: pendingRegistration.accountType === 'provider' ? false : true, // Providers start inactive
      lastLoginAt: new Date(),
    });

    // Automated Provider Registration
    if (pendingRegistration.accountType === 'provider') {
      await this.providerModel.create({
        phone: pendingRegistration.phoneNumber,
        businessName: pendingRegistration.fullName,
        ownerName: pendingRegistration.fullName,
        location: { type: 'Point', coordinates: [0, 0] },
        registrationStatus: 'pending',
        isApproved: false,
        isActive: false,
      });

      // Notify Admin about new registration
      const admin = await this.adminModel.findOne({ isActive: true });
      if (admin) {
        await this.notificationsService.createNotification({
          recipientId: admin._id.toString(),
          recipientType: 'admin',
          title: 'New Provider Registration',
          body: `A new provider "${pendingRegistration.fullName}" is waiting for approval.`,
          type: NotificationType.ALERT,
          data: {
            event: 'provider.registration.pending',
            phoneNumber: pendingRegistration.phoneNumber,
          }
        });
      }
    }

    await this.pendingRegistrationModel.deleteOne({ phoneNumber });

    return this.createAuthResponse(user);
  }

  // ===========================================
  // RESEND OTP
  // ===========================================
  async resendOtp(phoneNumber: string): Promise<IOtpResponse> {
    phoneNumber = this.normalizeSyrianPhoneNumber(phoneNumber);

    const pendingRegistration = await this.pendingRegistrationModel.findOne({
      phoneNumber,
    });

    if (!pendingRegistration) {
      throw new NotFoundException(
        'Registration not found or expired. Please register again.',
      );
    }

    await this.otpService.generateAndSaveForPending(phoneNumber);

    return this.otpService.createResponse(phoneNumber);
  }

  // ===========================================
  // LOGIN
  // ===========================================
  async login(loginDto: LoginDto): Promise<IAuthResponse> {
    const { password } = loginDto;
    const phoneNumber = this.normalizeSyrianPhoneNumber(loginDto.phoneNumber);

    const user = await this.userModel
      .findOne({ phoneNumber })
      .select('+password');

    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    if (!user.isVerified) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.ACCOUNT_NOT_VERIFIED);
    }

    if (!user.isActive) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.ACCOUNT_DEACTIVATED);
    }

    const isPasswordValid = await PasswordUtil.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    user.lastLoginAt = new Date();
    await user.save();

    return this.createAuthResponse(user);
  }

  // ===========================================
  // REFRESH TOKEN
  // ===========================================
  async refreshToken(refreshToken: string): Promise<IAuthResponse> {
    try {
      const payload = await TokenUtil.verifyRefreshToken(
        refreshToken,
        this.jwtService,
        this.configService,
      );

      const user = await this.userModel
        .findById(payload.userId)
        .select('+refreshToken');

      if (!user) {
        throw new UnauthorizedException(
          ERROR_MESSAGES.AUTH.INVALID_REFRESH_TOKEN,
        );
      }

      if (!user.refreshToken) {
        throw new UnauthorizedException(
          ERROR_MESSAGES.AUTH.INVALID_REFRESH_TOKEN,
        );
      }

      const isValid = await PasswordUtil.compare(
        refreshToken,
        user.refreshToken,
      );

      if (!isValid) {
        throw new UnauthorizedException(
          ERROR_MESSAGES.AUTH.INVALID_REFRESH_TOKEN,
        );
      }

      return this.createAuthResponse(user);
    } catch (error) {
      throw new UnauthorizedException(
        ERROR_MESSAGES.AUTH.INVALID_REFRESH_TOKEN,
      );
    }
  }

  // ===========================================
  // FORGOT PASSWORD
  // ===========================================
  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<IOtpResponse> {
    const phoneNumber = this.normalizeSyrianPhoneNumber(
      forgotPasswordDto.phoneNumber,
    );

    const user = await this.userModel.findOne({ phoneNumber });
    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER.NOT_FOUND);
    }

    await this.otpService.generateAndSave(phoneNumber);

    return {
      message: SUCCESS_MESSAGES.AUTH.PASSWORD_RESET_REQUESTED,
      phoneNumber,
      expiresIn: 300,
    };
  }

  // ===========================================
  // RESET PASSWORD
  // ===========================================
  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { otpCode, newPassword } = resetPasswordDto;
    const phoneNumber = this.normalizeSyrianPhoneNumber(
      resetPasswordDto.phoneNumber,
    );

    const user = await this.userModel
      .findOne({ phoneNumber })
      .select('+otpCode +otpExpiresAt +otpAttempts +password +refreshToken');

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER.NOT_FOUND);
    }

    await this.validateOtp(user, otpCode);

    user.password = await PasswordUtil.hash(newPassword);
    user.otpCode = null;
    user.otpExpiresAt = null;
    user.otpAttempts = 0;
    user.refreshToken = null;

    await user.save();

    return { message: SUCCESS_MESSAGES.AUTH.PASSWORD_RESET_SUCCESS };
  }

  // ===========================================
  // LOGOUT
  // ===========================================
  async logout(
    userId: string,
    meta?: { ip?: string; userAgent?: string },
  ): Promise<{ message: string }> {
    const user = await this.userModel.findById(userId).select('+refreshToken');

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException(
        ERROR_MESSAGES.AUTH.INVALID_REFRESH_TOKEN,
      );
    }

    await this.logoutModel.create({
      userId: user._id,
      refreshTokenHash: user.refreshToken,
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      success: true,
      reason: 'manual',
    });

    user.refreshToken = null;
    await user.save();

    return {
      message: SUCCESS_MESSAGES.AUTH.LOGOUT_SUCCESS,
    };
  }

  // ===========================================
  // REQUEST RESTORE OTP
  // ===========================================
  async requestRestoreOtp(phoneNumber: string): Promise<IOtpResponse> {
    phoneNumber = this.normalizeSyrianPhoneNumber(phoneNumber);

    const user = await this.userModel
      .findOne({ phoneNumber })
      .select('+otpCode +otpExpiresAt +otpAttempts');

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER.NOT_FOUND);
    }

    if (user.isActive) {
      throw new ConflictException('Account is already active');
    }

    await this.otpService.generateAndSave(phoneNumber);

    return {
      message: 'OTP sent to restore account',
      phoneNumber,
      expiresIn: 300,
    };
  }

  // ===========================================
  // CONFIRM RESTORE OTP
  // ===========================================
  async confirmRestore(
    phoneNumber: string,
    otpCode: string,
  ): Promise<IAuthResponse> {
    phoneNumber = this.normalizeSyrianPhoneNumber(phoneNumber);

    const user = await this.userModel
      .findOne({ phoneNumber })
      .select('+otpCode +otpExpiresAt +otpAttempts');

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER.NOT_FOUND);
    }

    await this.validateOtp(user, otpCode);

    user.isActive = true;
    user.otpCode = null;
    user.otpExpiresAt = null;
    user.otpAttempts = 0;
    user.lastLoginAt = new Date();

    await user.save();

    return this.createAuthResponse(user);
  }

  // ===========================================
  // OTP VALIDATION
  // ===========================================
  private async validateOtp(
    user: UserDocument,
    otpCode: string,
  ): Promise<void> {
    if (user.otpAttempts >= 3) {
      throw new BadRequestException(ERROR_MESSAGES.OTP.MAX_ATTEMPTS);
    }

    if (!user.otpCode || user.otpCode !== otpCode) {
      user.otpAttempts += 1;
      await user.save();
      throw new BadRequestException(ERROR_MESSAGES.OTP.INVALID);
    }

    if (!user.otpExpiresAt || OtpUtil.isExpired(user.otpExpiresAt)) {
      throw new BadRequestException(ERROR_MESSAGES.OTP.EXPIRED);
    }
  }

  // ===========================================
  // PENDING REGISTRATION OTP VALIDATION
  // ===========================================
  private async validatePendingOtp(
    pendingRegistration: PendingRegistrationDocument,
    otpCode: string,
  ): Promise<void> {
    if (pendingRegistration.otpAttempts >= 3) {
      throw new BadRequestException(ERROR_MESSAGES.OTP.MAX_ATTEMPTS);
    }

    if (
      !pendingRegistration.otpCode ||
      pendingRegistration.otpCode !== otpCode
    ) {
      pendingRegistration.otpAttempts += 1;
      await pendingRegistration.save();
      throw new BadRequestException(ERROR_MESSAGES.OTP.INVALID);
    }

    if (
      !pendingRegistration.otpExpiresAt ||
      OtpUtil.isExpired(pendingRegistration.otpExpiresAt)
    ) {
      throw new BadRequestException(ERROR_MESSAGES.OTP.EXPIRED);
    }
  }

  private normalizeSyrianPhoneNumber(phoneNumber: string): string {
    const digits = String(phoneNumber || '').replace(/[^\d]/g, '');

    if (/^09\d{8}$/.test(digits)) {
      return `+963${digits.slice(1)}`;
    }

    if (/^9639\d{8}$/.test(digits)) {
      return `+${digits}`;
    }

    return String(phoneNumber || '').trim();
  }

  // ===========================================
  // GENERATE AUTH RESPONSE
  // ===========================================
  private async createAuthResponse(user: UserDocument): Promise<IAuthResponse> {
    let providerId: string | undefined;
    if (user.accountType === 'provider') {
      const provider = await this.providerModel.findOne({ phone: user.phoneNumber });
      if (provider) {
        providerId = provider._id.toString();
      }
    }

    const payload: IJwtPayload = {
      userId: user._id.toString(),
      phoneNumber: user.phoneNumber,
      accountType: user.accountType,
      // Normalize: 'customer' accountType → 'user' role so RolesGuard(Role.USER) passes
      role: user.accountType === 'customer' ? 'user' : user.accountType,
      isPremium: user.isPremium,
      providerId,
    };

    const tokens = await TokenUtil.generateTokens(
      payload,
      this.jwtService,
      this.configService,
    );

    user.refreshToken = await PasswordUtil.hash(tokens.refreshToken);
    await user.save();

    return {
      user: SanitizeUtil.user(user.toObject()),
      ...tokens,
    };
  }
}
