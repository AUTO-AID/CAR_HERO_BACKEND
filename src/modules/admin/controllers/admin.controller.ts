import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Param, Patch, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from '../services/admin.service';
import { AdminLoginDto } from '../dto/admin-login.dto';
import { Public, Roles, CurrentUser, Permissions } from '../../../core/decorators';
import { Role } from '../../../common/enums/roles.enum';
import { RolesGuard, PermissionsGuard } from '../../../core/guards';
import { RegistrationStatus, BookingStatus } from '../../../common/enums/status.enum';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(RolesGuard, PermissionsGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: AdminLoginDto) {
    return this.adminService.login(loginDto);
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
  // USERS MANAGEMENT
  // ===========================================

  @Get('users')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all users' })
  async getAllUsers(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.adminService.getAllUsers(Number(page) || 1, Number(limit) || 10);
  }

  @Get('users/search')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Search users by name or phone' })
  async searchUsers(@Query('query') query: string) {
    return this.adminService.searchUsers(query);
  }

  @Get('users/:id')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user by ID' })
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id/status')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Activate/Deactivate user' })
  async updateUserStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.adminService.updateUserStatus(id, isActive);
  }

  @Delete('users/:id')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete user' })
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
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
  async approveProvider(@Param('id') id: string) {
    return this.adminService.approveProvider(id);
  }

  @Patch('providers/:id/reject')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Reject provider registration' })
  async rejectProvider(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.adminService.rejectProvider(id, reason);
  }

  @Patch('providers/:id')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update provider data' })
  async updateProvider(
    @Param('id') id: string,
    @Body() updateData: any,
  ) {
    return this.adminService.updateProvider(id, updateData);
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
  async createService(@Body() serviceData: any) {
    return this.adminService.createService(serviceData);
  }

  @Patch('services/:id')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update system service' })
  async updateService(
    @Param('id') id: string,
    @Body() updateData: any,
  ) {
    return this.adminService.updateService(id, updateData);
  }

  @Delete('services/:id')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete system service' })
  async deleteService(@Param('id') id: string) {
    return this.adminService.deleteService(id);
  }

  // ===========================================
  // BOOKINGS MANAGEMENT
  // ===========================================

  @Get('bookings')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all bookings' })
  async getAllBookings(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.adminService.getAllBookings(Number(page) || 1, Number(limit) || 10);
  }

  @Get('bookings/:id')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get booking by ID' })
  async getBookingById(@Param('id') id: string) {
    return this.adminService.getBookingById(id);
  }

  @Patch('bookings/:id/status')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update booking status' })
  async updateBookingStatus(
    @Param('id') id: string,
    @Body('status') status: BookingStatus,
  ) {
    return this.adminService.updateBookingStatus(id, status);
  }

  @Delete('bookings/:id')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete booking' })
  async deleteBooking(@Param('id') id: string) {
    return this.adminService.deleteBooking(id);
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

  @Get('stats/bookings')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get booking statistics by status' })
  async getBookingStats() {
    return this.adminService.getBookingStats();
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
  async createAdmin(@Body() adminData: any) {
    return this.adminService.createAdmin(adminData);
  }

  @Patch(':id/permissions')
  @Roles(Role.ADMIN)
  @Permissions('all')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update admin permissions' })
  async updateAdminPermissions(
    @Param('id') id: string,
    @Body('permissions') permissions: string[],
  ) {
    return this.adminService.updateAdminPermissions(id, permissions);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  @Permissions('all')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Toggle admin active status' })
  async toggleAdminStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.adminService.toggleAdminStatus(id, isActive);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @Permissions('all')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete an admin account' })
  async deleteAdmin(@Param('id') id: string) {
    return this.adminService.deleteAdmin(id);
  }
}
