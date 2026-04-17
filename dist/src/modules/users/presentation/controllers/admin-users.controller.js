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
exports.AdminUsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../../core/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../../core/guards/roles.guard");
const roles_enum_1 = require("../../../../core/enums/roles.enum");
const roles_decorator_1 = require("../../../../core/decorators/roles.decorator");
const get_all_users_admin_use_case_1 = require("../../application/use-cases/get-all-users-admin.use-case");
const get_user_details_admin_use_case_1 = require("../../application/use-cases/get-user-details-admin.use-case");
const delete_user_admin_use_case_1 = require("../../application/use-cases/delete-user-admin.use-case");
const update_profile_use_case_1 = require("../../application/use-cases/update-profile.use-case");
const update_user_dto_1 = require("../../application/dto/update-user.dto");
let AdminUsersController = class AdminUsersController {
    getAllUsersAdminUseCase;
    getUserDetailsAdminUseCase;
    deleteUserAdminUseCase;
    updateUserUseCase;
    constructor(getAllUsersAdminUseCase, getUserDetailsAdminUseCase, deleteUserAdminUseCase, updateUserUseCase) {
        this.getAllUsersAdminUseCase = getAllUsersAdminUseCase;
        this.getUserDetailsAdminUseCase = getUserDetailsAdminUseCase;
        this.deleteUserAdminUseCase = deleteUserAdminUseCase;
        this.updateUserUseCase = updateUserUseCase;
    }
    async findAll(page, limit) {
        return this.getAllUsersAdminUseCase.execute(Number(page) || 1, Number(limit) || 20);
    }
    async findById(id) {
        return this.getUserDetailsAdminUseCase.execute(id);
    }
    async update(id, updateUserDto) {
        return this.updateUserUseCase.execute(id, updateUserDto);
    }
    async delete(id) {
        return this.deleteUserAdminUseCase.execute(id);
    }
};
exports.AdminUsersController = AdminUsersController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all users (Admin only)' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of all users' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user by ID (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "findById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete user (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'User deleted successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "delete", null);
exports.AdminUsersController = AdminUsersController = __decorate([
    (0, swagger_1.ApiTags)('Admin - Users'),
    (0, common_1.Controller)('admin/users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    __metadata("design:paramtypes", [get_all_users_admin_use_case_1.GetAllUsersAdminUseCase,
        get_user_details_admin_use_case_1.GetUserDetailsAdminUseCase,
        delete_user_admin_use_case_1.DeleteUserAdminUseCase,
        update_profile_use_case_1.UpdateProfileUseCase])
], AdminUsersController);
//# sourceMappingURL=admin-users.controller.js.map