import {
  Controller,
  Get,
  Post,
  Body,
  Render,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Headers,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { WhatsAppWebService } from '../../application/services/whatsapp-web.service';
import { Permissions, Public, Roles } from '../../../../core/decorators';
import { JwtAuthGuard, PermissionsGuard, RolesGuard } from '../../../../core/guards';
import { Role } from '../../../../core/enums/roles.enum';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);

  constructor(
    private readonly whatsappService: WhatsAppWebService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * عرض صفحة تسجيل الدخول بالـ QR Code
   */
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @Permissions('whatsapp.manage')
  @Get('login')
  @Render('qr')
  async loginPage() {
    const isReady = this.whatsappService.isClientReady();
    const qrCode = this.whatsappService.getQRCode();

    this.logger.log(`Login Page Request - Ready: ${isReady}, Has QR: ${!!qrCode}`);

    if (isReady) {
      return {
        message: '✅ WhatsApp is already logged in',
        error: null,
        qrRaw: null,
      };
    }

    if (!qrCode) {
      return {
        error: 'Please try again shortly (Initializing QR)...',
        message: null,
        qrRaw: null,
      };
    }

    try {
      // نرسل الـ QR الخام للصفحة ليقوم المتصفح برسمه
      // هذا أفضل لأنه يتجنب مشاكل طول الـ Data URL
      return {
        qrRaw: qrCode,
        error: null,
        message: null,
      };
    } catch (e) {
      this.logger.error('Failed to prepare QR code', e);
      return {
        error: 'Failed to prepare QR code',
        message: null,
        qrRaw: null,
      };
    }
  }

  /**
   * الحصول على QR Code كـ JSON
   */
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @Permissions('whatsapp.manage')
  @Get('qr')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get QR Code for WhatsApp login' })
  async getQRCode() {
    const qrCode = this.whatsappService.getQRCode();
    const isReady = this.whatsappService.isClientReady();
    const lastError = this.whatsappService.getLastError();

    if (isReady) {
      return {
        status: 'ready',
        message: 'WhatsApp is already logged in',
        qrCode: null,
      };
    }

    if (!qrCode) {
      return {
        status: lastError ? 'error' : 'loading',
        message: lastError || 'Please wait, generating QR code...',
        qrCode: null,
      };
    }

    const qrDataURL = await this.whatsappService.getQRCodeDataURL();

    return {
      status: 'qr_ready',
      message: 'Please scan the QR code',
      qrCode: qrDataURL,
    };
  }

  /**
   * التحقق من حالة الاتصال
   */
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @Permissions('whatsapp.read')
  @Get('status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check WhatsApp connection status' })
  getStatus() {
    const isReady = this.whatsappService.isClientReady();
    const hasQR = !!this.whatsappService.getQRCode();
    const lastError = this.whatsappService.getLastError();

    return {
      isReady,
      hasQR,
      lastError,
      status: isReady ? 'connected' : hasQR ? 'waiting_qr' : lastError ? 'error' : 'initializing',
      message: isReady
        ? 'WhatsApp is connected'
        : hasQR
        ? 'Please scan QR code'
        : lastError
        ? lastError
        : 'Initializing...',
    };
  }

  /**
   * إرسال رسالة (للاختبار - محمي بكلمة مرور)
   */
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @Permissions('whatsapp.send')
  @Post('send-message')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send WhatsApp message (Protected)' })
  async sendMessage(
    @Headers('x-password') password: string,
    @Body() body: { phone: string; message: string },
  ) {
    const apiPassword = this.configService.get<string>('WHATSAPP_API_PASSWORD');

    if (password !== apiPassword) {
      throw new BadRequestException('Invalid password');
    }

    if (!body.message) {
      throw new BadRequestException('Message is required');
    }

    if (!body.phone) {
      throw new BadRequestException('Phone number is required');
    }

    if (!this.whatsappService.isClientReady()) {
      throw new BadRequestException('WhatsApp client is not ready');
    }

    await this.whatsappService.sendMessage(body.phone, body.message);

    return {
      ok: true,
      message: '✅ Message sent successfully',
    };
  }

  /**
   * إعادة تشغيل الـ Client
   */
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @Permissions('whatsapp.manage')
  @Post('restart')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restart WhatsApp client' })
  async restart(@Headers('x-password') password: string) {
    const apiPassword = this.configService.get<string>('WHATSAPP_API_PASSWORD');

    if (password !== apiPassword) {
      throw new BadRequestException('Invalid password');
    }

    await this.whatsappService.restart();

    return {
      ok: true,
      message: 'WhatsApp client restarted',
    };
  }
}
