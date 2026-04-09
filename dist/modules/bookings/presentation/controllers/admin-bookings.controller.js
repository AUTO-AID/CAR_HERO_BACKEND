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
exports.AdminBookingsController = void 0;
const common_1 = require("@nestjs/common");
const get_bookings_use_case_1 = require("../../application/use-cases/get-bookings.use-case");
const update_booking_status_use_case_1 = require("../../application/use-cases/update-booking-status.use-case");
const get_booking_stats_use_case_1 = require("../../application/use-cases/get-booking-stats.use-case");
const booking_status_enum_1 = require("../../domain/enums/booking-status.enum");
const jwt_auth_guard_1 = require("../../../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../../common/guards/roles.guard");
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
const roles_enum_1 = require("../../../../common/enums/roles.enum");
let AdminBookingsController = class AdminBookingsController {
    getBookings;
    updateStatus;
    getStatsUseCase;
    constructor(getBookings, updateStatus, getStatsUseCase) {
        this.getBookings = getBookings;
        this.updateStatus = updateStatus;
        this.getStatsUseCase = getStatsUseCase;
    }
    async getAllBookings(skip, limit) {
        const bookings = await this.getBookings.getUserBookings('all_dummy', skip, limit);
        return { success: true, ...bookings };
    }
    async getStats() {
        const stats = await this.getStatsUseCase.execute();
        return { success: true, data: stats };
    }
    async getBooking(id) {
        const booking = await this.getBookings.getBookingById(id);
        return { success: true, data: booking };
    }
    async updateBookingStatus(id, status) {
        const booking = await this.updateStatus.execute(id, status);
        return { success: true, data: booking };
    }
    async deleteBooking(id) {
        return { success: true, message: 'Booking deleted (Implementation skeleton)' };
    }
};
exports.AdminBookingsController = AdminBookingsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('skip')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AdminBookingsController.prototype, "getAllBookings", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminBookingsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminBookingsController.prototype, "getBooking", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminBookingsController.prototype, "updateBookingStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminBookingsController.prototype, "deleteBooking", null);
exports.AdminBookingsController = AdminBookingsController = __decorate([
    (0, common_1.Controller)('v1/admin/bookings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.ADMIN),
    __metadata("design:paramtypes", [get_bookings_use_case_1.GetBookingsUseCase,
        update_booking_status_use_case_1.UpdateBookingStatusUseCase,
        get_booking_stats_use_case_1.GetBookingStatsUseCase])
], AdminBookingsController);
//# sourceMappingURL=admin-bookings.controller.js.map