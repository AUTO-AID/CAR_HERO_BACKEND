import {
  Controller,
  Get,
  Put,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Inject,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IProviderRepository } from '../../domain/repositories/provider.repository.interface';
import {
  CreateProviderDto,
  RejectProviderDto,
  UpdateProviderBankAccountDto,
  UpdateProviderDocumentsDto,
  UpdateProviderDto,
  UpdateProviderProfileDto,
  ProviderQueryDto,
  NearbyProviderDto,
  UpdateLocationDto,
  UpdateProviderServicesDto,
  UpdateProviderWorkingHoursDto,
  UpdateStatusDto,
} from '../../application/dtos/provider.dto';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { PermissionsGuard } from '../../../../core/guards/permissions.guard';
import { Roles } from '../../../../core/decorators/roles.decorator';
import { Permissions } from '../../../../core/decorators/permissions.decorator';
import { CurrentUser } from '../../../../core/decorators/current-user.decorator';
import { Public } from '../../../../core/decorators/public.decorator';
import { Role } from '../../../../core/enums/roles.enum';
import { ParseObjectIdPipe } from '../../../../core/pipes/parse-objectid.pipe';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

// Use Cases
import { GetProvidersUseCase } from '../../application/use-cases/get-providers.use-case';
import { GetProviderByIdUseCase } from '../../application/use-cases/get-provider-by-id.use-case';
import { UpdateProviderUseCase } from '../../application/use-cases/update-provider.use-case';
import { UpdateProviderLocationUseCase } from '../../application/use-cases/update-provider-location.use-case';
import { UpdateProviderStatusUseCase } from '../../application/use-cases/update-provider-status.use-case';
import { FindNearbyProvidersUseCase } from '../../application/use-cases/find-nearby-providers.use-case';
import { ApproveProviderUseCase } from '../../application/use-cases/approve-provider.use-case';
import { ManageProvidersUseCase } from '../../application/use-cases/manage-providers.use-case';
import { GetProviderStatsUseCase } from '../../application/use-cases/get-provider-stats.use-case';
import { GetTopRatedProvidersUseCase } from '../../application/use-cases/get-top-rated-providers.use-case';
import { GetProviderDashboardUseCase } from '../../application/use-cases/get-provider-dashboard.use-case';
import { AuditLogService } from '../../../audit/application/services/audit-log.service';

const providerDocumentsPath = join(process.cwd(), 'uploads', 'provider-documents');
if (!existsSync(providerDocumentsPath)) mkdirSync(providerDocumentsPath, { recursive: true });

@ApiTags('Providers')
@Controller('providers')
export class ProvidersController {
  constructor(
    private readonly getProvidersUseCase: GetProvidersUseCase,
    private readonly getProviderByIdUseCase: GetProviderByIdUseCase,
    private readonly updateProviderUseCase: UpdateProviderUseCase,
    private readonly updateProviderLocationUseCase: UpdateProviderLocationUseCase,
    private readonly updateProviderStatusUseCase: UpdateProviderStatusUseCase,
    private readonly findNearbyProvidersUseCase: FindNearbyProvidersUseCase,
    private readonly approveProviderUseCase: ApproveProviderUseCase,
    private readonly manageProvidersUseCase: ManageProvidersUseCase,
    private readonly getProviderStatsUseCase: GetProviderStatsUseCase,
    private readonly getTopRatedProvidersUseCase: GetTopRatedProvidersUseCase,
    private readonly getProviderDashboardUseCase: GetProviderDashboardUseCase,
    private readonly auditLogService: AuditLogService,
    @Inject(IProviderRepository)
    private readonly providerRepository: IProviderRepository,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  private getActorId(admin: any): string | undefined {
    return admin?._id || admin?.userId || admin?.id;
  }

  private async audit(admin: any, action: string, entityId: string, after?: any, metadata?: Record<string, any>) {
    await this.auditLogService.record({
      admin: this.getActorId(admin),
      adminEmail: admin?.email,
      adminName: admin?.name,
      action,
      entityType: 'provider',
      entityId,
      summary: `${action} on provider:${entityId}`,
      after: after || {},
      metadata: metadata || {},
    });
  }

  @Public()
  @Post('apply')
  @ApiOperation({ summary: 'Apply to become a provider from the website form' })
  @ApiResponse({ status: 201, description: 'Application submitted successfully' })
  async apply(@Body() dto: CreateProviderDto) {
    // Temporarily using the manageProvidersUseCase.create but overriding status
    return this.manageProvidersUseCase.create({
      ...dto,
      isApproved: false,
      isActive: false,
      registrationStatus: 'pending',
    } as any);
  }

  private async getCurrentProviderId(user: any): Promise<string> {
    const phone = user?.phoneNumber || user?.phone;
    if (!phone) {
      throw new UnauthorizedException('Phone number not found in token');
    }
    const provider = await this.providerRepository.findByPhone(phone);
    if (!provider) {
      throw new NotFoundException('Provider profile not found for this account');
    }
    return provider.id;
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all providers' })
  @ApiResponse({ status: 200, description: 'List of providers' })
  async findAll(@Query() query: ProviderQueryDto) {
    return this.getProvidersUseCase.execute(query);
  }

  @Public()
  @Get('nearby')
  @ApiOperation({ summary: 'Find nearby providers' })
  @ApiResponse({ status: 200, description: 'List of nearby providers' })
  async findNearby(@Query() dto: NearbyProviderDto) {
    return this.findNearbyProvidersUseCase.execute(dto);
  }

  @Public()
  @Get('top-rated')
  @ApiOperation({ summary: 'Get top rated approved providers' })
  @ApiResponse({ status: 200, description: 'Top rated providers' })
  async topRated(@Query('limit') limit?: number) {
    return this.getTopRatedProvidersUseCase.execute(Number(limit) || 10);
  }

  @Public()
  @Get('public/governorates')
  @ApiOperation({ summary: 'Get active/approved providers count by governorate for public map' })
  @ApiResponse({ status: 200, description: 'Provider counts by governorate' })
  async getPublicGovernorates() {
    return this.providerRepository.getProvidersByGovernorate();
  }

  @Public()
  @Get('public/statistics')
  @ApiOperation({ summary: 'Get live public platform statistics' })
  @ApiResponse({ status: 200, description: 'Live statistics calculated from the database' })
  async getPublicStatistics() {
    const users = this.connection.collection('users');
    const providers = this.connection.collection('providers');
    const orders = this.connection.collection('orders');
    const providerFilter = { isApproved: true, isActive: true };

    const [customers, approvedProviders, governorates, responseTime] = await Promise.all([
      users.countDocuments({ accountType: 'customer', isActive: true }),
      providers.countDocuments(providerFilter),
      providers.distinct('governorate', providerFilter),
      orders.aggregate([
        { $match: { createdAt: { $type: 'date' }, acceptedAt: { $type: 'date' } } },
        {
          $project: {
            minutes: {
              $divide: [{ $subtract: ['$acceptedAt', '$createdAt'] }, 60_000],
            },
          },
        },
        { $match: { minutes: { $gte: 0, $lte: 1_440 } } },
        { $group: { _id: null, averageMinutes: { $avg: '$minutes' } } },
      ]).toArray(),
    ]);

    const coveredAreas = new Set(
      governorates
        .filter((name): name is string => typeof name === 'string' && name.trim().length > 0)
        .map((name) => {
          const normalized = name.trim().toLowerCase();
          if (['damascus', 'rural damascus', 'rular damascus', 'دمشق', 'ريف دمشق'].includes(normalized)) {
            return 'damascus';
          }
          if (normalized === 'القامشلي') return 'الحسكة';
          return normalized;
        }),
    );

    return {
      customers,
      approvedProviders,
      coveredAreas: coveredAreas.size,
      averageResponseMinutes: Math.round(responseTime[0]?.averageMinutes || 0),
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current provider profile' })
  @ApiResponse({ status: 200, description: 'Provider profile' })
  async getProfile(@CurrentUser() user: any) {
    const providerId = await this.getCurrentProviderId(user);
    return this.getProviderByIdUseCase.execute(providerId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Put('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update current provider profile' })
  @ApiResponse({ status: 200, description: 'Updated provider profile' })
  async updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProviderProfileDto) {
    const providerId = await this.getCurrentProviderId(user);
    return this.updateProviderUseCase.execute(providerId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Put('me/location')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update provider location' })
  @ApiResponse({ status: 200, description: 'Location updated' })
  async updateLocation(@CurrentUser() user: any, @Body() dto: UpdateLocationDto) {
    const providerId = await this.getCurrentProviderId(user);
    return this.updateProviderLocationUseCase.execute(providerId, dto.longitude, dto.latitude);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Put('me/status')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update provider status' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateStatus(@CurrentUser() user: any, @Body() dto: UpdateStatusDto) {
    const providerId = await this.getCurrentProviderId(user);
    return this.updateProviderStatusUseCase.execute(providerId, dto.status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Put('me/services')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update current provider services and categories' })
  async updateMyServices(@CurrentUser() user: any, @Body() dto: UpdateProviderServicesDto) {
    const providerId = await this.getCurrentProviderId(user);
    return this.manageProvidersUseCase.updateServices(providerId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Put('me/working-hours')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update current provider working hours' })
  async updateMyWorkingHours(@CurrentUser() user: any, @Body() dto: UpdateProviderWorkingHoursDto) {
    const providerId = await this.getCurrentProviderId(user);
    return this.manageProvidersUseCase.updateWorkingHours(providerId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Put('me/documents')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update current provider verification documents' })
  async updateMyDocuments(@CurrentUser() user: any, @Body() dto: UpdateProviderDocumentsDto) {
    const providerId = await this.getCurrentProviderId(user);
    return this.manageProvidersUseCase.updateDocuments(providerId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Post('me/documents/upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: providerDocumentsPath,
      filename: (_request, file, callback) => {
        const extension = {
          'application/pdf': '.pdf',
          'image/jpeg': '.jpg',
          'image/png': '.png',
        }[file.mimetype] || extname(file.originalname).toLowerCase();
        callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_request, file, callback) => {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.mimetype)) {
        return callback(new BadRequestException('Only PDF, JPG, and PNG documents are allowed'), false);
      }
      callback(null, true);
    },
  }))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload a current provider verification document' })
  uploadMyDocument(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Document file is required');
    return { fileUrl: `/uploads/provider-documents/${file.filename}` };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Put('me/bank-account')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update current provider bank account' })
  async updateMyBankAccount(@CurrentUser() user: any, @Body() dto: UpdateProviderBankAccountDto) {
    const providerId = await this.getCurrentProviderId(user);
    return this.manageProvidersUseCase.updateBankAccount(providerId, dto);
  }

  // ===========================================
  // PROVIDER DASHBOARD
  // ===========================================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Get('dashboard/all-stats')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get combined dashboard stats for current provider' })
  async getCombinedStats(@CurrentUser() user: any) {
    const providerId = await this.getCurrentProviderId(user);
    const stats = await this.getProviderDashboardUseCase.getCombinedStats(providerId);
    return { success: true, data: stats };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Get('dashboard/summary')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get dashboard summary for current provider' })
  async getDashboardSummary(@CurrentUser() user: any) {
    const providerId = await this.getCurrentProviderId(user);
    return this.getProviderDashboardUseCase.getSummary(providerId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Get('dashboard/orders-stats')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get orders statistics for current provider' })
  async getOrdersStats(@CurrentUser() user: any) {
    const providerId = await this.getCurrentProviderId(user);
    return this.getProviderDashboardUseCase.getOrdersStats(providerId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Get('dashboard/revenue-stats')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get monthly revenue statistics for current provider' })
  async getRevenueStats(@CurrentUser() user: any) {
    const providerId = await this.getCurrentProviderId(user);
    return this.getProviderDashboardUseCase.getRevenueStats(providerId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Get('dashboard/services-performance')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get services performance for current provider' })
  async getServicesPerformance(@CurrentUser() user: any) {
    const providerId = await this.getCurrentProviderId(user);
    return this.getProviderDashboardUseCase.getServicesPerformance(providerId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @Permissions('providers.read')
  @Get('admin/stats')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get provider statistics (Admin only)' })
  async stats() {
    return this.getProviderStatsUseCase.execute();
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @Permissions('providers.create')
  @Post('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create provider (Admin only)' })
  async create(@Body() dto: CreateProviderDto, @CurrentUser() admin: any) {
    const result = await this.manageProvidersUseCase.create(dto);
    await this.audit(admin, 'provider.create', String(result?.id || ''), result);
    return result;
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @Permissions('providers.read')
  @Get('admin/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get provider by ID for admin' })
  async adminFindOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.getProviderByIdUseCase.execute(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @Permissions('providers.update')
  @Patch('admin/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update provider (Admin only)' })
  async adminUpdate(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateProviderDto, @CurrentUser() admin: any) {
    const result = await this.updateProviderUseCase.execute(id, dto);
    await this.audit(admin, 'provider.update', id, result, { fields: Object.keys(dto || {}) });
    return result;
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @Permissions('providers.status')
  @Patch('admin/:id/status')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Activate/deactivate provider (Admin only)' })
  async setActive(@Param('id', ParseObjectIdPipe) id: string, @Body('isActive') isActive: boolean, @CurrentUser() admin: any) {
    const result = await this.manageProvidersUseCase.setActive(id, isActive);
    await this.audit(admin, 'provider.status_update', id, result, { isActive });
    return result;
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @Permissions('providers.reject')
  @Patch('admin/:id/reject')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Reject provider registration (Admin only)' })
  async reject(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: RejectProviderDto, @CurrentUser() admin: any) {
    const result = await this.manageProvidersUseCase.reject(id, dto);
    await this.audit(admin, 'provider.reject', id, result, dto as any);
    return result;
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @Permissions('providers.delete')
  @Delete('admin/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Deactivate provider (Admin only)' })
  async delete(@Param('id', ParseObjectIdPipe) id: string, @CurrentUser() admin: any) {
    const result = await this.manageProvidersUseCase.setActive(id, false);
    await this.audit(admin, 'provider.deactivate', id, result);
    return result;
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get provider by ID' })
  @ApiResponse({ status: 200, description: 'Provider details' })
  async findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.getProviderByIdUseCase.execute(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @Permissions('providers.approve')
  @Post(':id/approve')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Approve provider (Admin only)' })
  @ApiResponse({ status: 200, description: 'Provider approved' })
  async approve(@Param('id', ParseObjectIdPipe) id: string, @CurrentUser() admin: any) {
    const result = await this.approveProviderUseCase.execute(id);
    await this.audit(admin, 'provider.approve', id, result);
    return result;
  }
}
