import { AuthService } from '../../application/services/auth.service';
import { RegisterDto, LoginDto, VerifyOtpDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto, RequestRestoreOtpDto, ConfirmRestoreOtpDto } from '../../application/dtos';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    checkWhatsAppStatus(): Promise<{
        connected: boolean;
        message: string;
    }>;
    register(registerDto: RegisterDto): Promise<import("../../../../core/interfaces").IOtpResponse>;
    verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<import("../../../../core/interfaces").IAuthResponse>;
    resendOtp(phoneNumber: string): Promise<import("../../../../core/interfaces").IOtpResponse>;
    login(loginDto: LoginDto): Promise<import("../../../../core/interfaces").IAuthResponse>;
    refreshToken(refreshTokenDto: RefreshTokenDto): Promise<import("../../../../core/interfaces").IAuthResponse>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<import("../../../../core/interfaces").IOtpResponse>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    requestRestoreOtp(dto: RequestRestoreOtpDto): Promise<import("../../../../core/interfaces").IOtpResponse>;
    confirmRestore(dto: ConfirmRestoreOtpDto): Promise<import("../../../../core/interfaces").IAuthResponse>;
    getMe(user: any): Promise<{
        user: any;
    }>;
    logout(userId: string): Promise<{
        message: string;
    }>;
}
