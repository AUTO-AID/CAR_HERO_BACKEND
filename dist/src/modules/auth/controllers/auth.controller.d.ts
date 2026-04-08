import { AuthService } from '../services/auth.service';
import { RegisterDto, LoginDto, VerifyOtpDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto, RequestRestoreOtpDto, ConfirmRestoreOtpDto } from '../dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    checkWhatsAppStatus(): Promise<{
        connected: boolean;
        message: string;
    }>;
    register(registerDto: RegisterDto): Promise<import("../../../shared/interfaces").IOtpResponse>;
    verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<import("../../../shared/interfaces").IAuthResponse>;
    resendOtp(phoneNumber: string): Promise<import("../../../shared/interfaces").IOtpResponse>;
    login(loginDto: LoginDto): Promise<import("../../../shared/interfaces").IAuthResponse>;
    refreshToken(refreshTokenDto: RefreshTokenDto): Promise<import("../../../shared/interfaces").IAuthResponse>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<import("../../../shared/interfaces").IOtpResponse>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    requestRestoreOtp(dto: RequestRestoreOtpDto): Promise<import("../../../shared/interfaces").IOtpResponse>;
    confirmRestore(dto: ConfirmRestoreOtpDto): Promise<import("../../../shared/interfaces").IAuthResponse>;
    getMe(user: any): Promise<{
        user: any;
    }>;
    logout(userId: string): Promise<{
        message: string;
    }>;
}
