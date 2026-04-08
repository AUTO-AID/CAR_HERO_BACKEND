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
import { User, UserDocument } from '../../users/schemas/user.schema';
import {
  PendingRegistration,
  PendingRegistrationDocument,
} from '../schemas/pending-registration.schema';

import {
  RegisterDto,
  LoginDto,
  VerifyOtpDto,
  ResetPasswordDto,
  ForgotPasswordDto,
} from '../dto';

import {
  IAuthResponse,
  IOtpResponse,
  IJwtPayload,
} from '../../../shared/interfaces';

import {
  PasswordUtil,
  TokenUtil,
  OtpUtil,
  SanitizeUtil,
} from '../../../shared/utils';

import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../../core/constants';
import { OtpService } from './otp.service';
import { Logout, LogoutDocument } from '../schemas/logout.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Logout.name) private logoutModel: Model<LogoutDocument>,
    @InjectModel(PendingRegistration.name)
    private pendingRegistrationModel: Model<PendingRegistrationDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private otpService: OtpService,
  ) {}

  // ===========================================
  // REGISTER
  // ===========================================
  async register(registerDto: RegisterDto): Promise<IOtpResponse> {
    const { phoneNumber, password, fullName, accountType, isTermsAccepted } =
      registerDto;

    const existingUser = await this.userModel.findOne({ phoneNumber });
    if (existingUser) {
      throw new ConflictException(ERROR_MESSAGES.USER.ALREADY_EXISTS);
    }

    const hashedPassword = await PasswordUtil.hash(password);

    await this.pendingRegistrationModel.findOneAndUpdate(
      { phoneNumber },
      {
        fullName,
        phoneNumber,
        password: hashedPassword,
        accountType: accountType || 'customer',
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
    const { phoneNumber, otpCode } = verifyOtpDto;

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
      isActive: true,
      lastLoginAt: new Date(),
    });

    await this.pendingRegistrationModel.deleteOne({ phoneNumber });

    return this.createAuthResponse(user);
  }

  // ===========================================
  // RESEND OTP
  // ===========================================
  async resendOtp(phoneNumber: string): Promise<IOtpResponse> {
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
    const { phoneNumber, password } = loginDto;

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
    const { phoneNumber } = forgotPasswordDto;

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
    const { phoneNumber, otpCode, newPassword } = resetPasswordDto;

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

  // ===========================================
  // GENERATE AUTH RESPONSE
  // ===========================================
  private async createAuthResponse(user: UserDocument): Promise<IAuthResponse> {
    const payload: IJwtPayload = {
      userId: user._id.toString(),
      phoneNumber: user.phoneNumber,
      accountType: user.accountType,
      role: user.accountType, // In this model, accountType is the role
      isPremium: user.isPremium,
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
