import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserDocument } from '../../../users/infrastructure/persistence/mongoose/schemas/user.schema';
import { ProviderDocument } from '../../../providers/infrastructure/persistence/mongoose/schemas/provider.schema';
import { PendingRegistrationDocument } from '../schemas/pending-registration.schema';
import { RegisterDto, LoginDto, VerifyOtpDto, ResetPasswordDto, ForgotPasswordDto } from '../dto';
import { IAuthResponse, IOtpResponse } from '../../../../core/interfaces';
import { OtpService } from './otp.service';
import { LogoutDocument } from '../schemas/logout.schema';
import { NotificationsService } from '../../notifications/notifications.service';
import { AdminDocument } from '../../../admin/infrastructure/persistence/mongoose/schemas/admin.schema';
export declare class AuthService {
    private userModel;
    private providerModel;
    private logoutModel;
    private pendingRegistrationModel;
    private adminModel;
    private jwtService;
    private configService;
    private otpService;
    private notificationsService;
    constructor(userModel: Model<UserDocument>, providerModel: Model<ProviderDocument>, logoutModel: Model<LogoutDocument>, pendingRegistrationModel: Model<PendingRegistrationDocument>, adminModel: Model<AdminDocument>, jwtService: JwtService, configService: ConfigService, otpService: OtpService, notificationsService: NotificationsService);
    register(registerDto: RegisterDto): Promise<IOtpResponse>;
    checkWhatsAppConnection(): Promise<boolean>;
    verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<IAuthResponse>;
    resendOtp(phoneNumber: string): Promise<IOtpResponse>;
    login(loginDto: LoginDto): Promise<IAuthResponse>;
    refreshToken(refreshToken: string): Promise<IAuthResponse>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<IOtpResponse>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    logout(userId: string, meta?: {
        ip?: string;
        userAgent?: string;
    }): Promise<{
        message: string;
    }>;
    requestRestoreOtp(phoneNumber: string): Promise<IOtpResponse>;
    confirmRestore(phoneNumber: string, otpCode: string): Promise<IAuthResponse>;
    private validateOtp;
    private validatePendingOtp;
    private createAuthResponse;
}
