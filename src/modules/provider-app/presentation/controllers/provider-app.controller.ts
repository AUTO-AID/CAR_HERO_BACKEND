import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../../core/decorators/current-user.decorator';
import { Roles } from '../../../../core/decorators/roles.decorator';
import { Role } from '../../../../core/enums/roles.enum';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { ParseObjectIdPipe } from '../../../../core/pipes/parse-objectid.pipe';
import {
  CompleteRequestDto,
  ProviderLocationDto,
  ProviderRegisterDeviceDto,
  ProviderRequestsQueryDto,
  RejectRequestDto,
  SetPresenceDto,
} from '../../application/dtos';
import { ProviderContextService } from '../../application/services/provider-context.service';
import { AdvanceRequestStatusUseCase } from '../../application/use-cases/advance-request-status.use-case';
import { GetProviderHomeUseCase } from '../../application/use-cases/get-provider-home.use-case';
import { GetProviderRequestUseCase } from '../../application/use-cases/get-provider-request.use-case';
import { GetProviderRequestsUseCase } from '../../application/use-cases/get-provider-requests.use-case';
import { RegisterDeviceTokenUseCase } from '../../application/use-cases/register-device-token.use-case';
import { RespondToRequestUseCase } from '../../application/use-cases/respond-to-request.use-case';
import { SetProviderPresenceUseCase } from '../../application/use-cases/set-provider-presence.use-case';
import { UpdateProviderLiveLocationUseCase } from '../../application/use-cases/update-provider-live-location.use-case';

/**
 * ProviderAppController — سطح التطبيق الميداني للفنّي
 *
 * منفصل عن `/providers` عمداً: تلك واجهة لوحة التحكّم على الويب (المحفظة،
 * الأرباح، الإحصاءات، إدارة الملف)، وهذه واجهة العمل على الطريق. الفصل يعني
 * أن كل مسار هنا مصمَّم لنداء واحد من شاشة واحدة، لا لتجميع بيانات لوحة.
 *
 * الأدوار: `provider` فقط، والملكية تُتحقّق داخل كل حالة استخدام على معرّف
 * الفنّي المشتقّ من التوكن لا من جسم الطلب.
 */
@ApiTags('Provider App')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PROVIDER)
@Controller('provider-app')
export class ProviderAppController {
  constructor(
    private readonly providerContext: ProviderContextService,
    private readonly getHome: GetProviderHomeUseCase,
    private readonly setPresence: SetProviderPresenceUseCase,
    private readonly getRequests: GetProviderRequestsUseCase,
    private readonly getRequest: GetProviderRequestUseCase,
    private readonly respond: RespondToRequestUseCase,
    private readonly advance: AdvanceRequestStatusUseCase,
    private readonly updateLocation: UpdateProviderLiveLocationUseCase,
    private readonly registerDevice: RegisterDeviceTokenUseCase,
  ) {}

  // ===========================================
  // PROFILE & HOME
  // ===========================================

  @Get('me')
  @ApiOperation({ summary: 'ملف الفنّي المختصر لشاشة «حسابي»' })
  @ApiResponse({ status: 200, description: 'Provider profile summary' })
  async me(@CurrentUser() user: any) {
    const { provider, providerId } = await this.providerContext.resolve(user);
    return {
      id: providerId,
      name: provider.ownerName || provider.businessName,
      businessName: provider.businessName,
      phone: provider.phone,
      email: provider.email ?? null,
      city: provider.city ?? null,
      status: provider.status,
      isApproved: provider.isApproved,
      isActive: provider.isActive,
      accountStatus: provider.accountStatus,
      averageRating: provider.averageRating,
      totalOrders: provider.totalOrders,
    };
  }

  @Get('home')
  @ApiOperation({ summary: 'حالة الاتصال والطلب النشِط والعرض المفتوح في نداء واحد' })
  async home(@CurrentUser() user: any) {
    return this.getHome.execute(await this.providerContext.resolve(user));
  }

  @Post('presence')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تشغيل/إيقاف الاتصال لاستقبال الطلبات' })
  async presence(@CurrentUser() user: any, @Body() dto: SetPresenceDto) {
    return this.setPresence.execute(await this.providerContext.resolve(user), dto);
  }

  @Post('device-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تسجيل رمز الجهاز للإشعارات المدفوعة' })
  async deviceToken(@CurrentUser() user: any, @Body() dto: ProviderRegisterDeviceDto) {
    return this.registerDevice.execute(await this.providerContext.resolve(user), dto);
  }

  @Post('location')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'نبضة موقع الفنّي (وتتبّع الطلب النشِط إن مُرّر معرّفه)' })
  async location(@CurrentUser() user: any, @Body() dto: ProviderLocationDto) {
    return this.updateLocation.execute(await this.providerContext.resolve(user), dto);
  }

  // ===========================================
  // REQUESTS
  // ===========================================

  @Get('requests')
  @ApiOperation({ summary: 'طلبات الفنّي — نشطة أو سابقة' })
  async requests(@CurrentUser() user: any, @Query() query: ProviderRequestsQueryDto) {
    return this.getRequests.execute(await this.providerContext.resolve(user), query);
  }

  @Get('requests/:id')
  @ApiOperation({ summary: 'تفاصيل طلب واحد مع سجلّ خطواته' })
  async request(@CurrentUser() user: any, @Param('id', ParseObjectIdPipe) id: string) {
    return this.getRequest.execute(await this.providerContext.resolve(user), id);
  }

  @Post('requests/:id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'قبول طلب معروض ضمن مهلته' })
  @ApiResponse({ status: 409, description: 'انتهت المهلة أو أُسند الطلب لفنّي آخر' })
  async accept(@CurrentUser() user: any, @Param('id', ParseObjectIdPipe) id: string) {
    return this.respond.accept(await this.providerContext.resolve(user), id);
  }

  @Post('requests/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'رفض طلب معروض وإعادة توزيعه على فنّي آخر' })
  async reject(
    @CurrentUser() user: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: RejectRequestDto,
  ) {
    return this.respond.reject(await this.providerContext.resolve(user), id, dto.reason);
  }

  /**
   * انتهى العدّاد على الشاشة. التطبيق يُبلّغ بدل انتظار دورة المسح، فينتقل
   * الطلب إلى الفنّي التالي في نفس اللحظة لا بعد ثوانٍ.
   */
  @Post('requests/:id/expire')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'الإبلاغ بانقضاء مهلة الرد لتسريع إعادة التوزيع' })
  async expire(@CurrentUser() user: any, @Param('id', ParseObjectIdPipe) id: string) {
    return this.respond.markUnanswered(await this.providerContext.resolve(user), id);
  }

  /**
   * الاعتذار عن حجز مجدول. منفصل عن `reject` لأنه فعل مختلف: `reject` يردّ على
   * عرضٍ قائم بمهلة، وهذا يتخلّى عن حجز أُسند بلا عرض ويخضع لحدّ زمني قبل
   * الموعد بدل مهلة عدّاد.
   */
  @Post('requests/:id/decline-booking')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'الاعتذار عن حجز مجدول قبل موعده بوقت كافٍ' })
  @ApiResponse({ status: 409, description: 'اقترب الموعد أكثر من اللازم أو بدأ العمل على الحجز' })
  async declineBooking(
    @CurrentUser() user: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: RejectRequestDto,
  ) {
    return this.respond.declineBooking(await this.providerContext.resolve(user), id, dto.reason);
  }

  @Post('requests/:id/en-route')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'بدء التوجّه إلى العميل' })
  async enRoute(@CurrentUser() user: any, @Param('id', ParseObjectIdPipe) id: string) {
    return this.advance.execute(await this.providerContext.resolve(user), id, 'en-route');
  }

  @Post('requests/:id/arrived')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تسجيل الوصول إلى موقع العميل' })
  async arrived(@CurrentUser() user: any, @Param('id', ParseObjectIdPipe) id: string) {
    return this.advance.execute(await this.providerContext.resolve(user), id, 'arrived');
  }

  @Post('requests/:id/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'بدء تنفيذ الخدمة' })
  async start(@CurrentUser() user: any, @Param('id', ParseObjectIdPipe) id: string) {
    return this.advance.execute(await this.providerContext.resolve(user), id, 'start');
  }

  @Post('requests/:id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'إنهاء الخدمة وإحالتها إلى تأكيد العميل' })
  async complete(
    @CurrentUser() user: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: CompleteRequestDto,
  ) {
    return this.advance.execute(await this.providerContext.resolve(user), id, 'complete', {
      notes: dto.notes,
    });
  }
}
