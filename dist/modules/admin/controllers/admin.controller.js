"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const admin_service_1 = require("../services/admin.service");
const admin_login_dto_1 = require("../dto/admin-login.dto");
const login_use_case_1 = require("../application/use-cases/login.use-case");
const create_membership_plan_dto_1 = require("../dto/create-membership-plan.dto");
const update_membership_plan_dto_1 = require("../dto/update-membership-plan.dto");
const decorators_1 = require("../../../core/decorators");
const roles_enum_1 = require("../../../common/enums/roles.enum");
const guards_1 = require("../../../core/guards");
const status_enum_1 = require("../../../common/enums/status.enum");
let AdminController = class AdminController {
    adminService;
    loginUseCase;
    constructor(adminService, loginUseCase) {
        this.adminService = adminService;
        this.loginUseCase = loginUseCase;
    }
    async login(loginDto) {
        return this.loginUseCase.execute(loginDto);
    }
    async refreshToken(refreshToken) {
        return this.adminService.refreshToken(refreshToken);
    }
    async logout(admin) {
        return this.adminService.logout(admin.userId);
    }
    async getProfile(admin) {
        return { admin };
    }
    async getAllUsers(page, limit) {
        return this.adminService.getAllUsers(Number(page) || 1, Number(limit) || 10);
    }
    async searchUsers(query) {
        return this.adminService.searchUsers(query);
    }
    async getUserById(id) {
        return this.adminService.getUserById(id);
    }
    async updateUserStatus(id, isActive) {
        return this.adminService.updateUserStatus(id, isActive);
    }
    async deleteUser(id) {
        return this.adminService.deleteUser(id);
    }
    async getAllProviders(status, page, limit) {
        return this.adminService.getAllProviders(status, Number(page) || 1, Number(limit) || 10);
    }
    async getProviderById(id) {
        return this.adminService.getProviderById(id);
    }
    async approveProvider(id) {
        return this.adminService.approveProvider(id);
    }
    async rejectProvider(id, reason) {
        return this.adminService.rejectProvider(id, reason);
    }
    async updateProvider(id, updateData) {
        return this.adminService.updateProvider(id, updateData);
    }
    async getAllServices() {
        return this.adminService.getAllServices();
    }
    async createService(serviceData) {
        return this.adminService.createService(serviceData);
    }
    async updateService(id, updateData) {
        return this.adminService.updateService(id, updateData);
    }
    async deleteService(id) {
        return this.adminService.deleteService(id);
    }
    async getAllBookings(page, limit) {
        return this.adminService.getAllBookings(Number(page) || 1, Number(limit) || 10);
    }
    async getBookingById(id) {
        return this.adminService.getBookingById(id);
    }
    async updateBookingStatus(id, status) {
        return this.adminService.updateBookingStatus(id, status);
    }
    async deleteBooking(id) {
        return this.adminService.deleteBooking(id);
    }
    async getGeneralStats() {
        return this.adminService.getGeneralStats();
    }
    async getBookingStats() {
        return this.adminService.getBookingStats();
    }
    async getMonthlyRevenue() {
        return this.adminService.getMonthlyRevenue();
    }
    async getTopServices() {
        return this.adminService.getTopServices();
    }
    async getAllMembershipPlans() {
        return this.adminService.getAllMembershipPlans();
    }
    async createMembershipPlan(dto) {
        return this.adminService.createMembershipPlan(dto);
    }
    async updateMembershipPlan(id, dto) {
        return this.adminService.updateMembershipPlan(id, dto);
    }
    async deleteMembershipPlan(id) {
        return this.adminService.deleteMembershipPlan(id);
    }
    async getMembershipSubscribers(page, limit) {
        return this.adminService.getMembershipSubscribers(Number(page) || 1, Number(limit) || 10);
    }
    async getSettings() {
        return this.adminService.getAppSettings();
    }
    async updateMaintenanceMode(dto) {
        return this.adminService.updateMaintenanceMode(dto);
    }
    async listAdmins() {
        return this.adminService.listAdmins();
    }
    async createAdmin(adminData) {
        return this.adminService.createAdmin(adminData);
    }
    async updateAdminPermissions(id, permissions) {
        return this.adminService.updateAdminPermissions(id, permissions);
    }
    async toggleAdminStatus(id, isActive) {
        return this.adminService.toggleAdminStatus(id, isActive);
    }
    async deleteAdmin(id) {
        return this.adminService.deleteAdmin(id);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Admin login' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Login successful' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid credentials' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_login_dto_1.AdminLoginDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "login", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('refresh-token'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Refresh admin tokens' }),
    __param(0, (0, common_1.Body)('refreshToken')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "refreshToken", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Admin logout' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get current admin profile' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all users' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllUsers", null);
__decorate([
    (0, common_1.Get)('users/search'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Search users by name or phone' }),
    __param(0, (0, common_1.Query)('query')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "searchUsers", null);
__decorate([
    (0, common_1.Get)('users/:id'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUserById", null);
__decorate([
    (0, common_1.Patch)('users/:id/status'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Activate/Deactivate user' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('isActive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUserStatus", null);
__decorate([
    (0, common_1.Delete)('users/:id'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete user' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Get)('providers'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all providers' }),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllProviders", null);
__decorate([
    (0, common_1.Get)('providers/:id'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Get provider by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getProviderById", null);
__decorate([
    (0, common_1.Patch)('providers/:id/approve'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve provider registration' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveProvider", null);
__decorate([
    (0, common_1.Patch)('providers/:id/reject'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Reject provider registration' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectProvider", null);
__decorate([
    (0, common_1.Patch)('providers/:id'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Update provider data' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateProvider", null);
__decorate([
    (0, common_1.Get)('services'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all system services' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllServices", null);
__decorate([
    (0, common_1.Post)('services'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Create new system service' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createService", null);
__decorate([
    (0, common_1.Patch)('services/:id'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Update system service' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateService", null);
__decorate([
    (0, common_1.Delete)('services/:id'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete system service' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteService", null);
__decorate([
    (0, common_1.Get)('bookings'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all bookings' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllBookings", null);
__decorate([
    (0, common_1.Get)('bookings/:id'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Get booking by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getBookingById", null);
__decorate([
    (0, common_1.Patch)('bookings/:id/status'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Update booking status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateBookingStatus", null);
__decorate([
    (0, common_1.Delete)('bookings/:id'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete booking' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteBooking", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Get general platform statistics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getGeneralStats", null);
__decorate([
    (0, common_1.Get)('stats/bookings'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Get booking statistics by status' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getBookingStats", null);
__decorate([
    (0, common_1.Get)('stats/revenue'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Get monthly revenue statistics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getMonthlyRevenue", null);
__decorate([
    (0, common_1.Get)('stats/top-services'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Get top requested services' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTopServices", null);
__decorate([
    (0, common_1.Get)('memberships'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all membership plans' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllMembershipPlans", null);
__decorate([
    (0, common_1.Post)('memberships'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Create new membership plan' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_membership_plan_dto_1.CreateMembershipPlanDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createMembershipPlan", null);
__decorate([
    (0, common_1.Patch)('memberships/:id'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Update membership plan' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_membership_plan_dto_1.UpdateMembershipPlanDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateMembershipPlan", null);
__decorate([
    (0, common_1.Delete)('memberships/:id'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete membership plan' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteMembershipPlan", null);
__decorate([
    (0, common_1.Get)('memberships/subscribers'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all subscribed users' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getMembershipSubscribers", null);
__decorate([
    (0, common_1.Get)('settings'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Get application settings' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Patch)('settings/maintenance'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle maintenance mode' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateMaintenanceMode", null);
__decorate([
    (0, common_1.Get)('list'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, decorators_1.Permissions)('all'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'List all administrative accounts' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listAdmins", null);
__decorate([
    (0, common_1.Post)('create'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, decorators_1.Permissions)('all'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new admin account' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createAdmin", null);
__decorate([
    (0, common_1.Patch)(':id/permissions'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, decorators_1.Permissions)('all'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Update admin permissions' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('permissions')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateAdminPermissions", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, decorators_1.Permissions)('all'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle admin active status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('isActive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "toggleAdminStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, decorators_1.Permissions)('all'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an admin account' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteAdmin", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('Admin'),
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(guards_1.RolesGuard, guards_1.PermissionsGuard),
    __metadata("design:paramtypes", [admin_service_1.AdminService,
        login_use_case_1.LoginUseCase])
], AdminController);
//# sourceMappingURL=admin.controller.js.map