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
exports.ProvidersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const provider_dto_1 = require("../../application/dtos/provider.dto");
const jwt_auth_guard_1 = require("../../../../core/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../../core/guards/roles.guard");
const roles_decorator_1 = require("../../../../core/decorators/roles.decorator");
const current_user_decorator_1 = require("../../../../core/decorators/current-user.decorator");
const public_decorator_1 = require("../../../../core/decorators/public.decorator");
const roles_enum_1 = require("../../../../core/enums/roles.enum");
const parse_objectid_pipe_1 = require("../../../../core/pipes/parse-objectid.pipe");
const get_providers_use_case_1 = require("../../application/use-cases/get-providers.use-case");
const get_provider_by_id_use_case_1 = require("../../application/use-cases/get-provider-by-id.use-case");
const update_provider_use_case_1 = require("../../application/use-cases/update-provider.use-case");
const update_provider_location_use_case_1 = require("../../application/use-cases/update-provider-location.use-case");
const update_provider_status_use_case_1 = require("../../application/use-cases/update-provider-status.use-case");
const find_nearby_providers_use_case_1 = require("../../application/use-cases/find-nearby-providers.use-case");
const approve_provider_use_case_1 = require("../../application/use-cases/approve-provider.use-case");
let ProvidersController = class ProvidersController {
    getProvidersUseCase;
    getProviderByIdUseCase;
    updateProviderUseCase;
    updateProviderLocationUseCase;
    updateProviderStatusUseCase;
    findNearbyProvidersUseCase;
    approveProviderUseCase;
    constructor(getProvidersUseCase, getProviderByIdUseCase, updateProviderUseCase, updateProviderLocationUseCase, updateProviderStatusUseCase, findNearbyProvidersUseCase, approveProviderUseCase) {
        this.getProvidersUseCase = getProvidersUseCase;
        this.getProviderByIdUseCase = getProviderByIdUseCase;
        this.updateProviderUseCase = updateProviderUseCase;
        this.updateProviderLocationUseCase = updateProviderLocationUseCase;
        this.updateProviderStatusUseCase = updateProviderStatusUseCase;
        this.findNearbyProvidersUseCase = findNearbyProvidersUseCase;
        this.approveProviderUseCase = approveProviderUseCase;
    }
    async findAll(query) {
        return this.getProvidersUseCase.execute(query);
    }
    async findNearby(dto) {
        return this.findNearbyProvidersUseCase.execute(dto);
    }
    async getProfile(user) {
        return this.getProviderByIdUseCase.execute(user.id);
    }
    async updateProfile(user, dto) {
        return this.updateProviderUseCase.execute(user.id, dto);
    }
    async updateLocation(user, dto) {
        return this.updateProviderLocationUseCase.execute(user.id, dto.longitude, dto.latitude);
    }
    async updateStatus(user, dto) {
        return this.updateProviderStatusUseCase.execute(user.id, dto.status);
    }
    async findOne(id) {
        return this.getProviderByIdUseCase.execute(id);
    }
    async approve(id) {
        return this.approveProviderUseCase.execute(id);
    }
};
exports.ProvidersController = ProvidersController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all providers' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of providers' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [provider_dto_1.ProviderQueryDto]),
    __metadata("design:returntype", Promise)
], ProvidersController.prototype, "findAll", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('nearby'),
    (0, swagger_1.ApiOperation)({ summary: 'Find nearby providers' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of nearby providers' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [provider_dto_1.NearbyProviderDto]),
    __metadata("design:returntype", Promise)
], ProvidersController.prototype, "findNearby", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.PROVIDER),
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current provider profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Provider profile' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProvidersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.PROVIDER),
    (0, common_1.Put)('me'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Update current provider profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Updated provider profile' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, provider_dto_1.UpdateProviderDto]),
    __metadata("design:returntype", Promise)
], ProvidersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.PROVIDER),
    (0, common_1.Put)('me/location'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Update provider location' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Location updated' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, provider_dto_1.UpdateLocationDto]),
    __metadata("design:returntype", Promise)
], ProvidersController.prototype, "updateLocation", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.PROVIDER),
    (0, common_1.Put)('me/status'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Update provider status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status updated' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, provider_dto_1.UpdateStatusDto]),
    __metadata("design:returntype", Promise)
], ProvidersController.prototype, "updateStatus", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get provider by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Provider details' }),
    __param(0, (0, common_1.Param)('id', parse_objectid_pipe_1.ParseObjectIdPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProvidersController.prototype, "findOne", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, common_1.Post)(':id/approve'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve provider (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Provider approved' }),
    __param(0, (0, common_1.Param)('id', parse_objectid_pipe_1.ParseObjectIdPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProvidersController.prototype, "approve", null);
exports.ProvidersController = ProvidersController = __decorate([
    (0, swagger_1.ApiTags)('Providers'),
    (0, common_1.Controller)('providers'),
    __metadata("design:paramtypes", [get_providers_use_case_1.GetProvidersUseCase,
        get_provider_by_id_use_case_1.GetProviderByIdUseCase,
        update_provider_use_case_1.UpdateProviderUseCase,
        update_provider_location_use_case_1.UpdateProviderLocationUseCase,
        update_provider_status_use_case_1.UpdateProviderStatusUseCase,
        find_nearby_providers_use_case_1.FindNearbyProvidersUseCase,
        approve_provider_use_case_1.ApproveProviderUseCase])
], ProvidersController);
//# sourceMappingURL=providers.controller.js.map