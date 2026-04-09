import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserDocument } from '../../users/schemas/user.schema';
import { PendingRegistrationDocument } from '../schemas/pending-registration.schema';
import { RegisterDto, LoginDto, VerifyOtpDto, ResetPasswordDto, ForgotPasswordDto } from '../dto';
import { IAuthResponse, IOtpResponse } from '../../../shared/interfaces';
import { OtpService } from './otp.service';
import { LogoutDocument } from '../schemas/logout.schema';
export declare class AuthService {
    private userModel;
    private logoutModel;
    private pendingRegistrationModel;
    private jwtService;
    private configService;
    private otpService;
    constructor(userModel: Model<UserDocument>, logoutModel: Model<LogoutDocument>, pendingRegistrationModel: Model<PendingRegistrationDocument>, jwtService: JwtService, configService: ConfigService, otpService: OtpService);
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
