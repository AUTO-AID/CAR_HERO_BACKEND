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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import {
  CreateProviderDto,
  RejectProviderDto,
  UpdateProviderBankAccountDto,
  UpdateProviderDocumentsDto,
  UpdateProviderDto,
  ProviderQueryDto,
  NearbyProviderDto,
  UpdateLocationDto,
  UpdateProviderServicesDto,
  UpdateProviderWorkingHoursDto,
  UpdateStatusDto,
} from '../../application/dtos/provider.dto';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { Roles } from '../../../../core/decorators/roles.decorator';
import { CurrentUser } from '../../../../core/decorators/current-user.decorator';
import { Public } from '../../../../core/decorators/public.decorator';
import { Role } from '../../../../core/enums/roles.enum';
import { ParseObjectIdPipe } from '../../../../core/pipes/parse-objectid.pipe';

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
import { AuditLogService } from '../../../audit/application/services/audit-log.service';

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
    private readonly auditLogService: AuditLogService,
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
  async apply(@Body() dto: any) { // Using any for now to accept flexible frontend data
    // Temporarily using the manageProvidersUseCase.create but overriding status
    return this.manageProvidersUseCase.create({
      ...dto,
      isApproved: false,
      isActive: false,
      registrationStatus: 'pending',
    });
  }

  private getCurrentProviderId(user: any): string {
    return user?.id || user?._id || user?.userId;
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current provider profile' })
  @ApiResponse({ status: 200, description: 'Provider profile' })
  async getProfile(@CurrentUser() user: any) {
    return this.getProviderByIdUseCase.execute(this.getCurrentProviderId(user));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Put('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update current provider profile' })
  @ApiResponse({ status: 200, description: 'Updated provider profile' })
  async updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProviderDto) {
    return this.updateProviderUseCase.execute(this.getCurrentProviderId(user), dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Put('me/location')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update provider location' })
  @ApiResponse({ status: 200, description: 'Location updated' })
  async updateLocation(@CurrentUser() user: any, @Body() dto: UpdateLocationDto) {
    return this.updateProviderLocationUseCase.execute(this.getCurrentProviderId(user), dto.longitude, dto.latitude);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Put('me/status')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update provider status' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateStatus(@CurrentUser() user: any, @Body() dto: UpdateStatusDto) {
    return this.updateProviderStatusUseCase.execute(this.getCurrentProviderId(user), dto.status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Put('me/services')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update current provider services and categories' })
  async updateMyServices(@CurrentUser() user: any, @Body() dto: UpdateProviderServicesDto) {
    return this.manageProvidersUseCase.updateServices(this.getCurrentProviderId(user), dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Put('me/working-hours')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update current provider working hours' })
  async updateMyWorkingHours(@CurrentUser() user: any, @Body() dto: UpdateProviderWorkingHoursDto) {
    return this.manageProvidersUseCase.updateWorkingHours(this.getCurrentProviderId(user), dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Put('me/documents')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update current provider verification documents' })
  async updateMyDocuments(@CurrentUser() user: any, @Body() dto: UpdateProviderDocumentsDto) {
    return this.manageProvidersUseCase.updateDocuments(this.getCurrentProviderId(user), dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Put('me/bank-account')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update current provider bank account' })
  async updateMyBankAccount(@CurrentUser() user: any, @Body() dto: UpdateProviderBankAccountDto) {
    return this.manageProvidersUseCase.updateBankAccount(this.getCurrentProviderId(user), dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/stats')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get provider statistics (Admin only)' })
  async stats() {
    return this.getProviderStatsUseCase.execute();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create provider (Admin only)' })
  async create(@Body() dto: CreateProviderDto, @CurrentUser() admin: any) {
    const result = await this.manageProvidersUseCase.create(dto);
    await this.audit(admin, 'provider.create', String(result?.id || ''), result);
    return result;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get provider by ID for admin' })
  async adminFindOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.getProviderByIdUseCase.execute(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('admin/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update provider (Admin only)' })
  async adminUpdate(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateProviderDto, @CurrentUser() admin: any) {
    const result = await this.updateProviderUseCase.execute(id, dto);
    await this.audit(admin, 'provider.update', id, result, { fields: Object.keys(dto || {}) });
    return result;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('admin/:id/status')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Activate/deactivate provider (Admin only)' })
  async setActive(@Param('id', ParseObjectIdPipe) id: string, @Body('isActive') isActive: boolean, @CurrentUser() admin: any) {
    const result = await this.manageProvidersUseCase.setActive(id, isActive);
    await this.audit(admin, 'provider.status_update', id, result, { isActive });
    return result;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('admin/:id/reject')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Reject provider registration (Admin only)' })
  async reject(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: RejectProviderDto, @CurrentUser() admin: any) {
    const result = await this.manageProvidersUseCase.reject(id, dto);
    await this.audit(admin, 'provider.reject', id, result, dto as any);
    return result;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
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
