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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../../core/guards/jwt-auth.guard");
const get_profile_use_case_1 = require("../../application/use-cases/get-profile.use-case");
const update_profile_use_case_1 = require("../../application/use-cases/update-profile.use-case");
const delete_account_use_case_1 = require("../../application/use-cases/delete-account.use-case");
const get_user_stats_use_case_1 = require("../../application/use-cases/get-user-stats.use-case");
const update_user_dto_1 = require("../../application/dto/update-user.dto");
const current_user_decorator_1 = require("../../../../core/decorators/current-user.decorator");
let UsersController = class UsersController {
    getProfileUseCase;
    updateProfileUseCase;
    deleteAccountUseCase;
    getUserStatsUseCase;
    constructor(getProfileUseCase, updateProfileUseCase, deleteAccountUseCase, getUserStatsUseCase) {
        this.getProfileUseCase = getProfileUseCase;
        this.updateProfileUseCase = updateProfileUseCase;
        this.deleteAccountUseCase = deleteAccountUseCase;
        this.getUserStatsUseCase = getUserStatsUseCase;
    }
    async getProfile(userId) {
        return this.getProfileUseCase.execute(userId);
    }
    async updateProfile(userId, updateUserDto) {
        return this.updateProfileUseCase.execute(userId, updateUserDto);
    }
    async deleteAccount(userId) {
        return this.deleteAccountUseCase.execute(userId);
    }
    async getStats(userId) {
        return this.getUserStatsUseCase.execute(userId);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User profile retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Update current user profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User profile updated successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('_id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Delete)('me'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete current user account' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Account deleted successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deleteAccount", null);
__decorate([
    (0, common_1.Get)('me/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User statistics retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getStats", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('Users'),
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    __metadata("design:paramtypes", [get_profile_use_case_1.GetProfileUseCase,
        update_profile_use_case_1.UpdateProfileUseCase,
        delete_account_use_case_1.DeleteAccountUseCase,
        get_user_stats_use_case_1.GetUserStatsUseCase])
], UsersController);
//# sourceMappingURL=users.controller.js.map