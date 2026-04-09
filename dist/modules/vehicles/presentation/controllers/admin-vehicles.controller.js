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
exports.AdminVehiclesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../../common/guards/roles.guard");
const get_user_vehicles_use_case_1 = require("../../application/use-cases/get-user-vehicles.use-case");
const get_all_vehicles_admin_use_case_1 = require("../../application/use-cases/get-all-vehicles-admin.use-case");
const get_vehicle_details_admin_use_case_1 = require("../../application/use-cases/get-vehicle-details-admin.use-case");
const delete_vehicle_admin_use_case_1 = require("../../application/use-cases/delete-vehicle-admin.use-case");
const get_vehicle_stats_use_case_1 = require("../../application/use-cases/get-vehicle-stats.use-case");
const get_top_vehicle_models_use_case_1 = require("../../application/use-cases/get-top-vehicle-models.use-case");
const get_vehicle_distribution_use_case_1 = require("../../application/use-cases/get-vehicle-distribution.use-case");
const get_vehicle_year_stats_use_case_1 = require("../../application/use-cases/get-vehicle-year-stats.use-case");
let AdminVehiclesController = class AdminVehiclesController {
    getUserVehiclesUseCase;
    getAllVehiclesAdminUseCase;
    getVehicleDetailsAdminUseCase;
    deleteVehicleAdminUseCase;
    getVehicleStatsUseCase;
    getTopVehicleModelsUseCase;
    getVehicleDistributionUseCase;
    getVehicleYearStatsUseCase;
    constructor(getUserVehiclesUseCase, getAllVehiclesAdminUseCase, getVehicleDetailsAdminUseCase, deleteVehicleAdminUseCase, getVehicleStatsUseCase, getTopVehicleModelsUseCase, getVehicleDistributionUseCase, getVehicleYearStatsUseCase) {
        this.getUserVehiclesUseCase = getUserVehiclesUseCase;
        this.getAllVehiclesAdminUseCase = getAllVehiclesAdminUseCase;
        this.getVehicleDetailsAdminUseCase = getVehicleDetailsAdminUseCase;
        this.deleteVehicleAdminUseCase = deleteVehicleAdminUseCase;
        this.getVehicleStatsUseCase = getVehicleStatsUseCase;
        this.getTopVehicleModelsUseCase = getTopVehicleModelsUseCase;
        this.getVehicleDistributionUseCase = getVehicleDistributionUseCase;
        this.getVehicleYearStatsUseCase = getVehicleYearStatsUseCase;
    }
    async getAllVehicles(page, limit) {
        return this.getAllVehiclesAdminUseCase.execute(Number(page) || 1, Number(limit) || 20);
    }
    async getVehicleStats() {
        return this.getVehicleStatsUseCase.execute();
    }
    async getTopModels(limit) {
        return this.getTopVehicleModelsUseCase.execute(Number(limit) || 10);
    }
    async getDistribution() {
        return this.getVehicleDistributionUseCase.execute();
    }
    async getYearStats() {
        return this.getVehicleYearStatsUseCase.execute();
    }
    async getVehicleById(id) {
        return this.getVehicleDetailsAdminUseCase.execute(id);
    }
    async deleteVehicle(id) {
        return this.deleteVehicleAdminUseCase.execute(id);
    }
    async getUserVehicles(userId, page, limit) {
        return this.getUserVehiclesUseCase.execute(userId, Number(page) || 1, Number(limit) || 10);
    }
};
exports.AdminVehiclesController = AdminVehiclesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all vehicles in the system (Admin only)' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: 'Page number' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: 'Items per page' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of all vehicles' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Admin access required' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AdminVehiclesController.prototype, "getAllVehicles", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get vehicle statistics by brand (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Vehicle statistics by brand' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Admin access required' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminVehiclesController.prototype, "getVehicleStats", null);
__decorate([
    (0, common_1.Get)('top-models'),
    (0, swagger_1.ApiOperation)({ summary: 'Get top vehicle models by usage (Admin only)' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: 'Number of models to return' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Top vehicle models' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Admin access required' }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminVehiclesController.prototype, "getTopModels", null);
__decorate([
    (0, common_1.Get)('distribution'),
    (0, swagger_1.ApiOperation)({ summary: 'Get vehicle distribution by brand (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Vehicle distribution with percentages' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Admin access required' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminVehiclesController.prototype, "getDistribution", null);
__decorate([
    (0, common_1.Get)('year-stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get vehicle statistics by year (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Vehicle statistics by manufacturing year' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Admin access required' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminVehiclesController.prototype, "getYearStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get vehicle details by ID (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Vehicle details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Vehicle not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Admin access required' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminVehiclesController.prototype, "getVehicleById", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a vehicle (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Vehicle deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Vehicle not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Admin access required' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminVehiclesController.prototype, "deleteVehicle", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all vehicles for a specific user (Admin only)' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: 'Page number' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: 'Items per page' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of user vehicles' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Admin access required' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], AdminVehiclesController.prototype, "getUserVehicles", null);
exports.AdminVehiclesController = AdminVehiclesController = __decorate([
    (0, swagger_1.ApiTags)('Admin - Vehicles'),
    (0, common_1.Controller)('admin/vehicles'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    __metadata("design:paramtypes", [get_user_vehicles_use_case_1.GetUserVehiclesUseCase,
        get_all_vehicles_admin_use_case_1.GetAllVehiclesAdminUseCase,
        get_vehicle_details_admin_use_case_1.GetVehicleDetailsAdminUseCase,
        delete_vehicle_admin_use_case_1.DeleteVehicleAdminUseCase,
        get_vehicle_stats_use_case_1.GetVehicleStatsUseCase,
        get_top_vehicle_models_use_case_1.GetTopVehicleModelsUseCase,
        get_vehicle_distribution_use_case_1.GetVehicleDistributionUseCase,
        get_vehicle_year_stats_use_case_1.GetVehicleYearStatsUseCase])
], AdminVehiclesController);
//# sourceMappingURL=admin-vehicles.controller.js.map