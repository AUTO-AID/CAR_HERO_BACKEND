import { Injectable } from '@nestjs/common';
import { RegistrationStatus } from '../../../../core/enums/status.enum';
import { AdminLoginDto } from '../dtos/admin-login.dto';
import { CreateMembershipPlanDto } from '../dtos/create-membership-plan.dto';
import { UpdateMembershipPlanDto } from '../dtos/update-membership-plan.dto';

import { AdminAuthService } from './admin-auth.service';
import { AdminUsersService } from './admin-users.service';
import { AdminProvidersService, ProviderListFilters } from './admin-providers.service';
import { AdminServicesService, AdminServiceFilters } from './admin-services.service';
import { AdminStatsService } from './admin-stats.service';
import { AdminAdminsService } from './admin-admins.service';
import { AdminMembershipsService } from './admin-memberships.service';
import { AdminSettingsService } from './admin-settings.service';
import { CreateAdminDto } from '../dtos/admin-management.dto';
import { AdminListFilters } from './admin-admins.service';
import { UpdateAppSettingsDto, UpdateMaintenanceDto } from '../dtos/update-settings.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly adminUsersService: AdminUsersService,
    private readonly adminProvidersService: AdminProvidersService,
    private readonly adminServicesService: AdminServicesService,
    private readonly adminStatsService: AdminStatsService,
    private readonly adminAdminsService: AdminAdminsService,
    private readonly adminMembershipsService: AdminMembershipsService,
    private readonly adminSettingsService: AdminSettingsService,
  ) {}

  // ===========================================
  // AUTHENTICATION
  // ===========================================
  async login(loginDto: AdminLoginDto) {
    return this.adminAuthService.login(loginDto);
  }

  async refreshToken(refreshToken: string) {
    return this.adminAuthService.refreshToken(refreshToken);
  }

  async logout(adminId: string) {
    return this.adminAuthService.logout(adminId);
  }

  // ===========================================
  // USERS MANAGEMENT
  // ===========================================
  async getAllUsers(page = 1, limit = 10) {
    return this.adminUsersService.getAllUsers(page, limit);
  }

  async getUserById(id: string) {
    return this.adminUsersService.getUserById(id);
  }

  async updateUserStatus(id: string, isActive: boolean) {
    return this.adminUsersService.updateUserStatus(id, isActive);
  }

  async deleteUser(id: string) {
    return this.adminUsersService.deleteUser(id);
  }

  async searchUsers(query: string) {
    return this.adminUsersService.searchUsers(query);
  }

  // ===========================================
  // PROVIDERS MANAGEMENT
  // ===========================================
  async getAllProviders(filters?: ProviderListFilters, page = 1, limit = 10) {
    return this.adminProvidersService.getAllProviders(filters, page, limit);
  }

  async getProvidersMap(filters?: ProviderListFilters) {
    return this.adminProvidersService.getProvidersMap(filters);
  }

  async getProviderById(id: string) {
    return this.adminProvidersService.getProviderById(id);
  }

  async approveProvider(id: string) {
    return this.adminProvidersService.approveProvider(id);
  }

  async rejectProvider(id: string, reason: string) {
    return this.adminProvidersService.rejectProvider(id, reason);
  }

  async updateProvider(id: string, updateData: any) {
    return this.adminProvidersService.updateProvider(id, updateData);
  }

  // ===========================================
  // SERVICES MANAGEMENT
  // ===========================================
  async getAllServices(filters?: AdminServiceFilters, page = 1, limit = 100) {
    return this.adminServicesService.getAllServices(filters, page, limit);
  }

  async createService(serviceData: any) {
    return this.adminServicesService.createService(serviceData);
  }

  async updateService(id: string, updateData: any) {
    return this.adminServicesService.updateService(id, updateData);
  }

  async deleteService(id: string) {
    return this.adminServicesService.deleteService(id);
  }

  // ===========================================
  // STATISTICS & ANALYTICS
  // ===========================================
  async getGeneralStats() {
    return this.adminStatsService.getGeneralStats();
  }

  async getOrderStats() {
    return this.adminStatsService.getOrderStats();
  }

  async getBookingsAnalytics() {
    return this.adminStatsService.getBookingsAnalytics();
  }

  async getMonthlyRevenue() {
    return this.adminStatsService.getMonthlyRevenue();
  }

  async getTopServices() {
    return this.adminStatsService.getTopServices();
  }

  // ===========================================
  // DASHBOARD ANALYTICS (PROVIDERS)
  // ===========================================
  async getDashboardSummary() {
    return this.adminStatsService.getDashboardSummary();
  }

  async getExcelSummary() {
    return this.adminStatsService.getExcelSummary();
  }

  async getProvidersByGovernorate() {
    return this.adminStatsService.getProvidersByGovernorate();
  }

  async getProvidersByService() {
    return this.adminStatsService.getProvidersByService();
  }

  async getProvidersGrowth() {
    return this.adminStatsService.getProvidersGrowth();
  }

  async getTopCities() {
    return this.adminStatsService.getTopCities();
  }

  async getSyriaProvidersMap() {
    return this.adminStatsService.getSyriaProvidersMap();
  }

  async getUsersAnalytics() {
    return this.adminStatsService.getUsersAnalytics();
  }

  // ===========================================
  // ADMINS MANAGEMENT (SUPER ADMIN)
  // ===========================================
  async listAdmins(filters?: AdminListFilters) {
    return this.adminAdminsService.listAdmins(filters);
  }

  async createAdmin(adminData: CreateAdminDto) {
    return this.adminAdminsService.createAdmin(adminData);
  }

  async updateAdminPermissions(id: string, permissions: string[], actorId: string) {
    return this.adminAdminsService.updateAdminPermissions(id, permissions, actorId);
  }

  async toggleAdminStatus(id: string, isActive: boolean, actorId: string) {
    return this.adminAdminsService.toggleAdminStatus(id, isActive, actorId);
  }

  async resetAdminPassword(id: string, password: string, actorId: string) {
    return this.adminAdminsService.resetAdminPassword(id, password, actorId);
  }

  async deleteAdmin(id: string, actorId: string) {
    return this.adminAdminsService.deleteAdmin(id, actorId);
  }

  // ===========================================
  // MEMBERSHIPS MANAGEMENT
  // ===========================================
  async getAllMembershipPlans() {
    return this.adminMembershipsService.getAllMembershipPlans();
  }

  async createMembershipPlan(dto: CreateMembershipPlanDto) {
    return this.adminMembershipsService.createMembershipPlan(dto);
  }

  async updateMembershipPlan(id: string, dto: UpdateMembershipPlanDto) {
    return this.adminMembershipsService.updateMembershipPlan(id, dto);
  }

  async deleteMembershipPlan(id: string) {
    return this.adminMembershipsService.deleteMembershipPlan(id);
  }

  async getMembershipSubscribers(page = 1, limit = 10, filters: any = {}) {
    return this.adminMembershipsService.getMembershipSubscribers(page, limit, filters);
  }

  async getMembershipStats() {
    return this.adminMembershipsService.getMembershipStats();
  }

  // ===========================================
  // SETTINGS & CONFIGURATION
  // ===========================================
  async getAppSettings() {
    return this.adminSettingsService.getAppSettings();
  }

  async updateAppSettings(dto: UpdateAppSettingsDto) {
    return this.adminSettingsService.updateAppSettings(dto);
  }

  async getPublicSettings() {
    return this.adminSettingsService.getPublicSettings();
  }

  async updateMaintenanceMode(dto: UpdateMaintenanceDto) {
    return this.adminSettingsService.updateMaintenanceMode(dto);
  }
}
