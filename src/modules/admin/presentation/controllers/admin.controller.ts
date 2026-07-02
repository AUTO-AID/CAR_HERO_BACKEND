import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Param, Patch, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from '../../application/services/admin.service';
import { AdminLoginDto } from '../../application/dtos/admin-login.dto';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { CreateMembershipPlanDto } from '../../application/dtos/create-membership-plan.dto';
import { UpdateMembershipPlanDto } from '../../application/dtos/update-membership-plan.dto';
import { CreateServiceDto } from '../../../services/application/dto/create-service.dto';
import { Public, Roles, CurrentUser, Permissions } from '../../../../core/decorators';
import { Role } from '../../../../core/enums/roles.enum';
import { RolesGuard, PermissionsGuard } from '../../../../core/guards';
import { RegistrationStatus } from '../../../../core/enums/status.enum';
import { AuditLogService } from '../../../audit/application/services/audit-log.service';
import { CreateAdminDto, ResetAdminPasswordDto, UpdateAdminPermissionsDto, UpdateAdminStatusDto } from '../../application/dtos/admin-management.dto';
import { UpdateAppSettingsDto, UpdateMaintenanceDto } from '../../application/dtos/update-settings.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(RolesGuard, PermissionsGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly loginUseCase: LoginUseCase,
    private readonly auditLogService: AuditLogService,
  ) {}

  private getActorId(admin: any): string | undefined {
    return admin?._id || admin?.userId || admin?.id;
  }

  private async audit(admin: any, action: string, entityType: string, entityId?: string, after?: any, metadata?: Record<string, any>) {
    await this.auditLogService.record({
      admin: this.getActorId(admin),
      adminEmail: admin?.email,
      adminName: admin?.name,
      action,
      entityType,
      entityId,
      summary: `${action} on ${entityType}${entityId ? `:${entityId}` : ''}`,
      after: after || {},
      metadata: metadata || {},
    });
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: AdminLoginDto) {
    return this.loginUseCase.execute(loginDto);
  }

  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh admin tokens' })
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    return this.adminService.refreshToken(refreshToken);
  }

  @Post('logout')
  @Roles(Role.ADMIN)
  @Permissions('admin.profile')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin logout' })
  async logout(@CurrentUser() admin: any) {
    return this.adminService.logout(admin.userId);
  }

  @Get('me')
  @Roles(Role.ADMIN)
  @Permissions('admin.profile')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current admin profile' })
  async getProfile(@CurrentUser() admin: any) {
    return { admin };
  }

  // ===========================================
  // PROVIDERS MANAGEMENT
  // ===========================================

  @Get('providers')
  @Roles(Role.ADMIN)
  @Permissions('providers.read')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all providers' })
  async getAllProviders(
    @Query('status') status: RegistrationStatus,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('runtimeStatus') runtimeStatus?: string,
    @Query('city') city?: string,
    @Query('service') service?: string,
    @Query('emergency') emergency?: string,
    @Query('minRating') minRating?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.adminService.getAllProviders(
      {
        status,
        search,
        isActive: isActive === undefined ? undefined : isActive === 'true',
        runtimeStatus,
        city,
        service,
        emergency: emergency === undefined ? undefined : emergency === 'true',
        minRating: minRating === undefined ? undefined : Number(minRating),
        sortBy,
        sortOrder,
      },
      Number(page) || 1,
      Number(limit) || 10,
    );
  }

  @Get('providers/map')
  @Roles(Role.ADMIN)
  @Permissions('providers.read')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get provider locations and operational metrics for interactive map' })
  async getProvidersMap(
    @Query('status') status: RegistrationStatus,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('runtimeStatus') runtimeStatus?: string,
    @Query('location') location?: string,
    @Query('governorate') governorate?: string,
    @Query('city') city?: string,
    @Query('service') service?: string,
    @Query('emergency') emergency?: string,
    @Query('minRating') minRating?: string,
  ) {
    return this.adminService.getProvidersMap({
      status,
      search,
      isActive: isActive === undefined ? undefined : isActive === 'true',
      runtimeStatus,
      location,
      governorate,
      city,
      service,
      emergency: emergency === undefined ? undefined : emergency === 'true',
      minRating: minRating === undefined ? undefined : Number(minRating),
    });
  }

  @Get('providers/top-requested')
  @Roles(Role.ADMIN)
  @Permissions('providers.read')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get top requested providers ranked by actual order count' })
  async getTopRequestedProviders(@Query('limit') limit?: string) {
    return this.adminService.getTopRequestedProviders(Number(limit) || 100);
  }

  @Get('providers/:id')
  @Roles(Role.ADMIN)
  @Permissions('providers.read')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get provider by ID' })
  async getProviderById(@Param('id') id: string) {
    return this.adminService.getProviderById(id);
  }

  @Patch('providers/:id/approve')
  @Roles(Role.ADMIN)
  @Permissions('providers.approve')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Approve provider registration' })
  async approveProvider(@Param('id') id: string, @CurrentUser() admin: any) {
    const result = await this.adminService.approveProvider(id);
    await this.audit(admin, 'provider.approve', 'provider', id, result);
    return result;
  }

  @Patch('providers/:id/reject')
  @Roles(Role.ADMIN)
  @Permissions('providers.reject')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Reject provider registration' })
  async rejectProvider(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() admin: any,
  ) {
    const result = await this.adminService.rejectProvider(id, reason);
    await this.audit(admin, 'provider.reject', 'provider', id, result, { reason });
    return result;
  }

  @Patch('providers/:id')
  @Roles(Role.ADMIN)
  @Permissions('providers.update')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update provider data' })
  async updateProvider(
    @Param('id') id: string,
    @Body() updateData: any,
    @CurrentUser() admin: any,
  ) {
    const result = await this.adminService.updateProvider(id, updateData);
    await this.audit(admin, 'provider.update', 'provider', id, result, { fields: Object.keys(updateData || {}) });
    return result;
  }

  // ===========================================
  // SERVICES MANAGEMENT
  // ===========================================

  @Get('services')
  @Roles(Role.ADMIN)
  @Permissions('services.read')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all system services' })
  async getAllServices(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('category') category?: any,
    @Query('isActive') isActive?: string,
    @Query('isEmergency') isEmergency?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.adminService.getAllServices(
      {
        search,
        category,
        isActive: isActive === undefined ? undefined : isActive === 'true',
        isEmergency: isEmergency === undefined ? undefined : isEmergency === 'true',
        sortBy,
        sortOrder,
      },
      Number(page) || 1,
      Number(limit) || 100,
    );
  }

  @Post('services')
  @Roles(Role.ADMIN)
  @Permissions('services.create')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create new system service' })
  async createService(@Body() serviceData: CreateServiceDto, @CurrentUser() admin: any) {
    const result = await this.adminService.createService(serviceData);
    await this.audit(admin, 'service.create', 'service', String(result?._id || result?.id || ''), result);
    return result;
  }

  @Patch('services/:id')
  @Roles(Role.ADMIN)
  @Permissions('services.update')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update system service' })
  async updateService(
    @Param('id') id: string,
    @Body() updateData: any,
    @CurrentUser() admin: any,
  ) {
    const result = await this.adminService.updateService(id, updateData);
    await this.audit(admin, 'service.update', 'service', id, result, { fields: Object.keys(updateData || {}) });
    return result;
  }

  @Delete('services/:id')
  @Roles(Role.ADMIN)
  @Permissions('services.delete')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete system service' })
  async deleteService(@Param('id') id: string, @CurrentUser() admin: any) {
    const result = await this.adminService.deleteService(id);
    await this.audit(admin, 'service.delete', 'service', id, result);
    return result;
  }

  // ===========================================
  // STATISTICS & ANALYTICS
  // ===========================================

  @Get('stats')
  @Roles(Role.ADMIN)
  @Permissions('analytics.read')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get general platform statistics' })
  async getGeneralStats() {
    return this.adminService.getGeneralStats();
  }

  @Get('stats/orders')
  @Roles(Role.ADMIN)
  @Permissions('analytics.read')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get order statistics by status' })
  async getOrderStats() {
    return this.adminService.getOrderStats();
  }

  @Get('stats/revenue')
  @Roles(Role.ADMIN)
  @Permissions('finance.read')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get monthly revenue statistics' })
  async getMonthlyRevenue() {
    return this.adminService.getMonthlyRevenue();
  }
  @Get('stats/top-services')
  @Roles(Role.ADMIN)
  @Permissions('analytics.read')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get top requested services' })
  async getTopServices() {
    return this.adminService.getTopServices();
  }

  @Get('stats/bookings-analytics')
  @Roles(Role.ADMIN)
  @Permissions('analytics.read')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get scheduled bookings analytics for admin dashboard charts' })
  async getBookingsAnalytics() {
    return this.adminService.getBookingsAnalytics();
  }

  @Get('stats/users-analytics')
  @Roles(Role.ADMIN)
  @Permissions('analytics.read')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get users growth and loyalty analytics' })
  async getUsersAnalytics() {
    return this.adminService.getUsersAnalytics();
  }

  @Get('operations-intelligence/preview')
  @Roles(Role.ADMIN)
  @Permissions('analytics.read')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Preview operational pressure, recruitment recommendations, and provider workload intelligence' })
  async getOperationsIntelligencePreview(
    @Query('days') days?: string,
    @Query('previousDays') previousDays?: string,
    @Query('limit') limit?: string,
    @Query('city') city?: string,
    @Query('serviceId') serviceId?: string,
  ) {
    return this.adminService.getOperationsIntelligencePreview({
      days: Number(days) || undefined,
      previousDays: Number(previousDays) || undefined,
      limit: Number(limit) || undefined,
      city,
      serviceId,
    });
  }

  @Post('operations-intelligence/scan')
  @Roles(Role.ADMIN)
  @Permissions('operations.manage')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Run operational intelligence scan and persist recommendations and alerts' })
  async runOperationsIntelligenceScan(
    @Body() body: any,
  ) {
    return this.adminService.runOperationsIntelligenceScan({
      days: Number(body?.days) || undefined,
      previousDays: Number(body?.previousDays) || undefined,
      limit: Number(body?.limit) || undefined,
      city: body?.city,
      serviceId: body?.serviceId,
    });
  }

  @Get('operations-intelligence/recommendations')
  @Roles(Role.ADMIN)
  @Permissions('analytics.read')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List saved operational recommendations' })
  async getOperationalRecommendations(@Query() query: any) {
    return this.adminService.getOperationalRecommendations(query);
  }

  @Patch('operations-intelligence/recommendations/:id/status')
  @Roles(Role.ADMIN)
  @Permissions('operations.manage')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update operational recommendation status' })
  async updateOperationalRecommendationStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('note') note: string,
    @CurrentUser() admin: any,
  ) {
    return this.adminService.updateOperationalRecommendationStatus(id, status, note, admin);
  }

  @Post('operations-intelligence/recommendations/:id/notes')
  @Roles(Role.ADMIN)
  @Permissions('operations.manage')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add a note to an operational recommendation' })
  async addOperationalRecommendationNote(
    @Param('id') id: string,
    @Body('note') note: string,
    @CurrentUser() admin: any,
  ) {
    return this.adminService.addOperationalRecommendationNote(id, note, admin);
  }

  @Patch('operations-intelligence/recommendations/:id/assign')
  @Roles(Role.ADMIN)
  @Permissions('operations.manage')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Assign an operational recommendation or update its follow-up due date' })
  async assignOperationalRecommendation(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() admin: any,
  ) {
    return this.adminService.assignOperationalRecommendation(id, body, admin);
  }

  @Get('operations-intelligence/alerts')
  @Roles(Role.ADMIN)
  @Permissions('analytics.read')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List operational intelligence alerts' })
  async getOperationalAlerts(@Query() query: any) {
    return this.adminService.getOperationalAlerts(query);
  }

  @Patch('operations-intelligence/alerts/:id/read')
  @Roles(Role.ADMIN)
  @Permissions('analytics.read')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mark operational alert as read' })
  async markOperationalAlertRead(@Param('id') id: string) {
    return this.adminService.markOperationalAlertRead(id);
  }

  @Patch('operations-intelligence/alerts/:id/resolve')
  @Roles(Role.ADMIN)
  @Permissions('operations.manage')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Resolve operational alert' })
  async resolveOperationalAlert(@Param('id') id: string) {
    return this.adminService.resolveOperationalAlert(id);
  }

  // ===========================================
  // DASHBOARD ANALYTICS (PROVIDERS)
  // ===========================================

  @Get('dashboard/summary')
  @Roles(Role.ADMIN)
  @Permissions('analytics.read')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get comprehensive dashboard summary' })
  async getDashboardSummary() {
    return this.adminService.getDashboardSummary();
  }

  @Get('dashboard/excel-summary')
  @Roles(Role.ADMIN)
  @Permissions('analytics.read')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get excel data analytics summary' })
  async getExcelSummary() {
    return this.adminService.getExcelSummary();
  }

  @Get('dashboard/providers-by-governorate')
  @Roles(Role.ADMIN)
  @Permissions('analytics.read')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get providers count by governorate' })
  async getProvidersByGovernorate() {
    return this.adminService.getProvidersByGovernorate();
  }

  @Get('dashboard/providers-by-service')
  @Roles(Role.ADMIN)
  @Permissions('analytics.read')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get providers count by service category' })
  async getProvidersByService() {
    return this.adminService.getProvidersByService();
  }

  @Get('dashboard/providers-growth')
  @Roles(Role.ADMIN)
  @Permissions('analytics.read')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get providers growth over time' })
  async getProvidersGrowth() {
    return this.adminService.getProvidersGrowth();
  }

  @Get('dashboard/top-cities')
  @Roles(Role.ADMIN)
  @Permissions('analytics.read')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get top cities by providers count' })
  async getTopCities() {
    return this.adminService.getTopCities();
  }

  @Get('dashboard/map/syria-providers')
  @Roles(Role.ADMIN)
  @Permissions('analytics.read')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get providers locations for map visualization' })
  async getSyriaProvidersMap() {
    return this.adminService.getSyriaProvidersMap();
  }

  // ===========================================
  // MEMBERSHIPS MANAGEMENT
  // ===========================================

  @Get('memberships')
  @Roles(Role.ADMIN)
  @Permissions('subscriptions.read')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Legacy: get all membership plans. Prefer GET /admin/subscription-plans' })
  async getAllMembershipPlans() {
    return this.adminService.getAllMembershipPlans();
  }

  @Get('subscription-plans')
  @Roles(Role.ADMIN)
  @Permissions('subscriptions.read')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all subscription plans (canonical admin API)' })
  async getAllSubscriptionPlans() {
    return this.getAllMembershipPlans();
  }

  @Post('memberships')
  @Roles(Role.ADMIN)
  @Permissions('subscriptions.create')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Legacy: create membership plan. Prefer POST /admin/subscription-plans' })
  async createMembershipPlan(@Body() dto: CreateMembershipPlanDto, @CurrentUser() admin: any) {
    const result = await this.adminService.createMembershipPlan(dto);
    await this.audit(admin, 'membership.create', 'subscription_plan', String(result?._id || result?.id || ''), result);
    return result;
  }

  @Post('subscription-plans')
  @Roles(Role.ADMIN)
  @Permissions('subscriptions.create')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create subscription plan (canonical admin API)' })
  async createSubscriptionPlan(@Body() dto: CreateMembershipPlanDto, @CurrentUser() admin: any) {
    const result = await this.adminService.createMembershipPlan(dto);
    await this.audit(admin, 'subscription_plan.create', 'subscription_plan', String(result?._id || result?.id || ''), result);
    return result;
  }

  @Patch('memberships/:id')
  @Roles(Role.ADMIN)
  @Permissions('subscriptions.update')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Legacy: update membership plan. Prefer PATCH /admin/subscription-plans/:id' })
  async updateMembershipPlan(
    @Param('id') id: string,
    @Body() dto: UpdateMembershipPlanDto,
    @CurrentUser() admin: any,
  ) {
    const result = await this.adminService.updateMembershipPlan(id, dto);
    await this.audit(admin, 'membership.update', 'subscription_plan', id, result, { fields: Object.keys(dto || {}) });
    return result;
  }

  @Patch('subscription-plans/:id')
  @Roles(Role.ADMIN)
  @Permissions('subscriptions.update')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update subscription plan (canonical admin API)' })
  async updateSubscriptionPlan(
    @Param('id') id: string,
    @Body() dto: UpdateMembershipPlanDto,
    @CurrentUser() admin: any,
  ) {
    const result = await this.adminService.updateMembershipPlan(id, dto);
    await this.audit(admin, 'subscription_plan.update', 'subscription_plan', id, result, { fields: Object.keys(dto || {}) });
    return result;
  }

  @Delete('memberships/:id')
  @Roles(Role.ADMIN)
  @Permissions('subscriptions.delete')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Legacy: delete membership plan. Prefer DELETE /admin/subscription-plans/:id' })
  async deleteMembershipPlan(@Param('id') id: string, @CurrentUser() admin: any) {
    const result = await this.adminService.deleteMembershipPlan(id);
    await this.audit(admin, 'membership.delete', 'subscription_plan', id, result);
    return result;
  }

  @Delete('subscription-plans/:id')
  @Roles(Role.ADMIN)
  @Permissions('subscriptions.delete')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete subscription plan (canonical admin API)' })
  async deleteSubscriptionPlan(@Param('id') id: string, @CurrentUser() admin: any) {
    const result = await this.adminService.deleteMembershipPlan(id);
    await this.audit(admin, 'subscription_plan.delete', 'subscription_plan', id, result);
    return result;
  }

  @Get('memberships/subscribers')
  @Roles(Role.ADMIN)
  @Permissions('subscriptions.read')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Legacy: get all subscribed users. Prefer GET /admin/subscriptions' })
  async getMembershipSubscribers(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query() filters: any,
  ) {
    return this.adminService.getMembershipSubscribers(Number(page) || 1, Number(limit) || 10, filters);
  }

  @Get('memberships/stats')
  @Roles(Role.ADMIN)
  @Permissions('subscriptions.read')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get subscription analytics for admin dashboard' })
  async getMembershipStats() {
    return this.adminService.getMembershipStats();
  }

  @Get('subscriptions')
  @Roles(Role.ADMIN)
  @Permissions('subscriptions.read')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all user subscriptions (canonical admin API)' })
  async getUserSubscriptions(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query() filters: any,
  ) {
    return this.getMembershipSubscribers(page, limit, filters);
  }

  // ===========================================
  // SETTINGS MANAGEMENT
  // ===========================================

  @Public()
  @Get('settings/public')
  @ApiOperation({ summary: 'Get non-sensitive public application settings' })
  async getPublicSettings() {
    return this.adminService.getPublicSettings();
  }

  @Get('settings')
  @Roles(Role.ADMIN)
  @Permissions('settings.read')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get application settings' })
  async getSettings() {
    return this.adminService.getAppSettings();
  }

  @Patch('settings')
  @Roles(Role.ADMIN)
  @Permissions('settings.update')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update supported application settings' })
  async updateSettings(@Body() dto: UpdateAppSettingsDto, @CurrentUser() admin: any) {
    const result = await this.adminService.updateAppSettings(dto);
    await this.audit(admin, 'setting.update', 'setting', undefined, result, { fields: Object.keys(dto) });
    return result;
  }

  @Patch('settings/maintenance')
  @Roles(Role.ADMIN)
  @Permissions('settings.update')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Toggle maintenance mode' })
  async updateMaintenanceMode(
    @Body() dto: UpdateMaintenanceDto,
    @CurrentUser() admin: any,
  ) {
    const result = await this.adminService.updateMaintenanceMode(dto);
    await this.audit(admin, 'setting.maintenance_update', 'setting', undefined, result, dto);
    return result;
  }

  // ===========================================
  // ADMINS MANAGEMENT (SUPER ADMIN ONLY)
  // ===========================================

  @Get('list')
  @Roles(Role.ADMIN)
  @Permissions('admins.read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List all administrative accounts' })
  async listAdmins(
    @Query('search') search?: string,
    @Query('status') status?: 'all' | 'active' | 'inactive',
    @Query('permission') permission?: string,
  ) {
    return this.adminService.listAdmins({ search, status, permission });
  }

  @Post('create')
  @Roles(Role.ADMIN)
  @Permissions('admins.create')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new admin account' })
  async createAdmin(@Body() adminData: CreateAdminDto, @CurrentUser() admin: any) {
    const result = await this.adminService.createAdmin(adminData);
    await this.audit(admin, 'admin.create', 'admin', String(result?._id || result?.id || ''), result);
    return result;
  }

  @Patch(':id/permissions')
  @Roles(Role.ADMIN)
  @Permissions('admins.update')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update admin permissions' })
  async updateAdminPermissions(
    @Param('id') id: string,
    @Body() dto: UpdateAdminPermissionsDto,
    @CurrentUser() admin: any,
  ) {
    const result = await this.adminService.updateAdminPermissions(id, dto.permissions, this.getActorId(admin)!);
    await this.audit(admin, 'admin.permissions_update', 'admin', id, result, { permissions: dto.permissions });
    return result;
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  @Permissions('admins.update')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Toggle admin active status' })
  async toggleAdminStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAdminStatusDto,
    @CurrentUser() admin: any,
  ) {
    const result = await this.adminService.toggleAdminStatus(id, dto.isActive, this.getActorId(admin)!);
    await this.audit(admin, 'admin.status_update', 'admin', id, result, { isActive: dto.isActive });
    return result;
  }

  @Patch(':id/password')
  @Roles(Role.ADMIN)
  @Permissions('admins.update')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Reset another admin password' })
  async resetAdminPassword(@Param('id') id: string, @Body() dto: ResetAdminPasswordDto, @CurrentUser() admin: any) {
    const result = await this.adminService.resetAdminPassword(id, dto.password, this.getActorId(admin)!);
    await this.audit(admin, 'admin.password_reset', 'admin', id);
    return result;
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @Permissions('admins.delete')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete an admin account' })
  async deleteAdmin(@Param('id') id: string, @CurrentUser() admin: any) {
    const result = await this.adminService.deleteAdmin(id, this.getActorId(admin)!);
    await this.audit(admin, 'admin.delete', 'admin', id, result);
    return result;
  }
}
