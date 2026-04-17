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
exports.ProviderBookingsController = void 0;
const common_1 = require("@nestjs/common");
const provider_flow_use_case_1 = require("../../application/use-cases/provider-flow.use-case");
const get_nearby_bookings_use_case_1 = require("../../application/use-cases/get-nearby-bookings.use-case");
const get_bookings_use_case_1 = require("../../application/use-cases/get-bookings.use-case");
const jwt_auth_guard_1 = require("../../../../core/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../../core/guards/roles.guard");
const roles_decorator_1 = require("../../../../core/decorators/roles.decorator");
const current_user_decorator_1 = require("../../../../core/decorators/current-user.decorator");
const roles_enum_1 = require("../../../../core/enums/roles.enum");
let ProviderBookingsController = class ProviderBookingsController {
    providerFlow;
    getNearbyBookings;
    getBookings;
    constructor(providerFlow, getNearbyBookings, getBookings) {
        this.providerFlow = providerFlow;
        this.getNearbyBookings = getNearbyBookings;
        this.getBookings = getBookings;
    }
    async nearby(providerId, longitude, latitude) {
        const bookings = await this.getNearbyBookings.execute(providerId, parseFloat(longitude), parseFloat(latitude), 15000);
        return { success: true, data: bookings };
    }
    async accept(providerId, id) {
        const booking = await this.providerFlow.accept(providerId, id);
        return { success: true, data: booking };
    }
    async reject(providerId, id) {
        const booking = await this.providerFlow.reject(providerId, id);
        return { success: true, data: booking };
    }
    async start(providerId, id) {
        const booking = await this.providerFlow.start(providerId, id);
        return { success: true, data: booking };
    }
    async complete(providerId, id) {
        const booking = await this.providerFlow.complete(providerId, id);
        return { success: true, data: booking };
    }
    async current(providerId, skip, limit) {
        const bookings = await this.getBookings.getProviderBookings(providerId, skip, limit);
        return { success: true, ...bookings };
    }
    async history(providerId, skip, limit) {
        const bookings = await this.getBookings.getProviderBookings(providerId, skip, limit);
        return { success: true, ...bookings };
    }
};
exports.ProviderBookingsController = ProviderBookingsController;
__decorate([
    (0, common_1.Get)('nearby'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('lon')),
    __param(2, (0, common_1.Query)('lat')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ProviderBookingsController.prototype, "nearby", null);
__decorate([
    (0, common_1.Patch)(':id/accept'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProviderBookingsController.prototype, "accept", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProviderBookingsController.prototype, "reject", null);
__decorate([
    (0, common_1.Patch)(':id/start'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProviderBookingsController.prototype, "start", null);
__decorate([
    (0, common_1.Patch)(':id/complete'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProviderBookingsController.prototype, "complete", null);
__decorate([
    (0, common_1.Get)('current'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('skip')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], ProviderBookingsController.prototype, "current", null);
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('skip')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], ProviderBookingsController.prototype, "history", null);
exports.ProviderBookingsController = ProviderBookingsController = __decorate([
    (0, common_1.Controller)('v1/provider/bookings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.PROVIDER),
    __metadata("design:paramtypes", [provider_flow_use_case_1.ProviderFlowUseCase,
        get_nearby_bookings_use_case_1.GetNearbyBookingsUseCase,
        get_bookings_use_case_1.GetBookingsUseCase])
], ProviderBookingsController);
//# sourceMappingURL=provider-bookings.controller.js.map