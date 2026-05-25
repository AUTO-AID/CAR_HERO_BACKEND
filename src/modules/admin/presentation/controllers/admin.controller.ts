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
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin logout' })
  async logout(@CurrentUser() admin: any) {
    return this.adminService.logout(admin.userId);
  }

  @Get('me')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
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
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all providers' })
  async getAllProviders(
    @Query('status') status: RegistrationStatus,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.adminService.getAllProviders(status, Number(page) || 1, Number(limit) || 10);
  }

  @Get('providers/:id')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get provider by ID' })
  async getProviderById(@Param('id') id: string) {
    return this.adminService.getProviderById(id);
  }

  @Patch('providers/:id/approve')
  @Roles(Role.ADMIN)
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
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all system services' })
  async getAllServices() {
    return this.adminService.getAllServices();
  }

  @Post('services')
  @Roles(Role.ADMIN)
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
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get general platform statistics' })
  async getGeneralStats() {
    return this.adminService.getGeneralStats();
  }

  @Get('stats/orders')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get order statistics by status' })
  async getOrderStats() {
    return this.adminService.getOrderStats();
  }

  @Get('stats/revenue')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get monthly revenue statistics' })
  async getMonthlyRevenue() {
    return this.adminService.getMonthlyRevenue();
  }

  @Get('stats/top-services')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get top requested services' })
  async getTopServices() {
    return this.adminService.getTopServices();
  }

  // ===========================================
  // DASHBOARD ANALYTICS (PROVIDERS)
  // ===========================================

  @Get('dashboard/summary')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get comprehensive dashboard summary' })
  async getDashboardSummary() {
    return this.adminService.getDashboardSummary();
  }

  @Get('dashboard/excel-summary')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get excel data analytics summary' })
  async getExcelSummary() {
    return this.adminService.getExcelSummary();
  }

  @Get('dashboard/providers-by-governorate')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get providers count by governorate' })
  async getProvidersByGovernorate() {
    return this.adminService.getProvidersByGovernorate();
  }

  @Get('dashboard/providers-by-service')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get providers count by service category' })
  async getProvidersByService() {
    return this.adminService.getProvidersByService();
  }

  @Get('dashboard/providers-growth')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get providers growth over time' })
  async getProvidersGrowth() {
    return this.adminService.getProvidersGrowth();
  }

  @Get('dashboard/top-cities')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get top cities by providers count' })
  async getTopCities() {
    return this.adminService.getTopCities();
  }

  @Get('dashboard/map/syria-providers')
  @Roles(Role.ADMIN)
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
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Legacy: get all membership plans. Prefer GET /admin/subscription-plans' })
  async getAllMembershipPlans() {
    return this.adminService.getAllMembershipPlans();
  }

  @Get('subscription-plans')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all subscription plans (canonical admin API)' })
  async getAllSubscriptionPlans() {
    return this.getAllMembershipPlans();
  }

  @Post('memberships')
  @Roles(Role.ADMIN)
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
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Legacy: get all subscribed users. Prefer GET /admin/subscriptions' })
  async getMembershipSubscribers(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.adminService.getMembershipSubscribers(Number(page) || 1, Number(limit) || 10);
  }

  @Get('subscriptions')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all user subscriptions (canonical admin API)' })
  async getUserSubscriptions(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.getMembershipSubscribers(page, limit);
  }

  // ===========================================
  // SETTINGS MANAGEMENT
  // ===========================================

  @Get('settings')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get application settings' })
  async getSettings() {
    return this.adminService.getAppSettings();
  }

  @Patch('settings/maintenance')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Toggle maintenance mode' })
  async updateMaintenanceMode(
    @Body() dto: { maintenanceMode: boolean; message?: string; messageAr?: string },
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
  @Permissions('all')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List all administrative accounts' })
  async listAdmins() {
    return this.adminService.listAdmins();
  }

  @Post('create')
  @Roles(Role.ADMIN)
  @Permissions('all')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new admin account' })
  async createAdmin(@Body() adminData: any, @CurrentUser() admin: any) {
    const result = await this.adminService.createAdmin(adminData);
    await this.audit(admin, 'admin.create', 'admin', String(result?._id || result?.id || ''), result);
    return result;
  }

  @Patch(':id/permissions')
  @Roles(Role.ADMIN)
  @Permissions('all')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update admin permissions' })
  async updateAdminPermissions(
    @Param('id') id: string,
    @Body('permissions') permissions: string[],
    @CurrentUser() admin: any,
  ) {
    const result = await this.adminService.updateAdminPermissions(id, permissions);
    await this.audit(admin, 'admin.permissions_update', 'admin', id, result, { permissions });
    return result;
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  @Permissions('all')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Toggle admin active status' })
  async toggleAdminStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
    @CurrentUser() admin: any,
  ) {
    const result = await this.adminService.toggleAdminStatus(id, isActive);
    await this.audit(admin, 'admin.status_update', 'admin', id, result, { isActive });
    return result;
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @Permissions('all')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete an admin account' })
  async deleteAdmin(@Param('id') id: string, @CurrentUser() admin: any) {
    const result = await this.adminService.deleteAdmin(id);
    await this.audit(admin, 'admin.delete', 'admin', id, result);
    return result;
  }
}
