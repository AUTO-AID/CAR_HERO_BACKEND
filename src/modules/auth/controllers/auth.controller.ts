import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from '../services/auth.service';
import {
  RegisterDto,
  LoginDto,
  VerifyOtpDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  RequestRestoreOtpDto,
  ConfirmRestoreOtpDto,
} from '../dto';
import { JwtAuthGuard } from '../../../core/guards';
import { CurrentUser, Public } from '../../../core/decorators';

@ApiTags('Authentication')
@Controller('auth')
@UseGuards(ThrottlerGuard) // ✅ Rate limiting على جميع endpoints
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ════════════════════════════════════════════════════════════════
  // 🔓 Public Endpoints (لا تحتاج Authentication)
  // ════════════════════════════════════════════════════════════════

  /**
   * التحقق من حالة اتصال WhatsApp
   */
  @Public()
  @Get('whatsapp/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check WhatsApp connection status' })
  async checkWhatsAppStatus() {
    const isConnected = await this.authService.checkWhatsAppConnection();
    return {
      connected: isConnected,
      message: isConnected
        ? 'WhatsApp is connected'
        : 'WhatsApp is not connected',
    };
  }

  /**
   * تسجيل حساب جديد
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Register new account',
    description: 'Create a new user account and send OTP via WhatsApp'
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * التحقق من OTP
   */
  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Verify OTP code',
    description: 'Verify OTP and activate account'
  })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  /**
   * إعادة إرسال OTP
   */
  @Public()
  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Resend OTP code',
    description: 'Resend OTP to phone number via WhatsApp'
  })
  async resendOtp(@Body('phoneNumber') phoneNumber: string) {
    return this.authService.resendOtp(phoneNumber);
  }

  /**
   * تسجيل الدخول
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Login',
    description: 'Login with phone number and password'
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * تحديث Access Token
   */
  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Refresh access token',
    description: 'Get new access token using refresh token'
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  /**
   * نسيت كلمة المرور
   */
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Forgot password',
    description: 'Request OTP to reset password'
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  /**
   * إعادة تعيين كلمة المرور
   */
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Reset password',
    description: 'Reset password using OTP code'
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  /**
   * طلب OTP لاسترجاع الحساب المحذوف
   */
  @Public()
  @Post('restore/request-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Request OTP to restore deleted account',
    description: 'Send OTP to restore soft-deleted account'
  })
  async requestRestoreOtp(@Body() dto: RequestRestoreOtpDto) {
    return this.authService.requestRestoreOtp(dto.phoneNumber);
  }

  /**
   * تأكيد OTP واسترجاع الحساب
   */
  @Public()
  @Post('restore/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Confirm OTP and restore account',
    description: 'Verify OTP and restore deleted account'
  })
  async confirmRestore(@Body() dto: ConfirmRestoreOtpDto) {
    return this.authService.confirmRestore(dto.phoneNumber, dto.otpCode);
  }

  // ════════════════════════════════════════════════════════════════
  // 🔐 Protected Endpoints (تحتاج Authentication)
  // ════════════════════════════════════════════════════════════════

  /**
   * الحصول على معلومات المستخدم الحالي
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get current user info',
    description: 'Get authenticated user information from JWT token'
  })
  async getMe(@CurrentUser() user: any) {
    return { user };
  }

  /**
   * تسجيل الخروج
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Logout',
    description: 'Logout and invalidate refresh token'
  })
  async logout(@CurrentUser('userId') userId: string) {
    return this.authService.logout(userId);
  }
}