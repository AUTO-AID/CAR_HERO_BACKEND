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
exports.UserBookingsController = void 0;
const common_1 = require("@nestjs/common");
const create_booking_use_case_1 = require("../../application/use-cases/create-booking.use-case");
const cancel_booking_use_case_1 = require("../../application/use-cases/cancel-booking.use-case");
const get_bookings_use_case_1 = require("../../application/use-cases/get-bookings.use-case");
const review_booking_use_case_1 = require("../../application/use-cases/review-booking.use-case");
const track_booking_use_case_1 = require("../../application/use-cases/track-booking.use-case");
const payment_booking_use_case_1 = require("../../application/use-cases/payment-booking.use-case");
const create_booking_dto_1 = require("../../application/dto/create-booking.dto");
const cache_manager_1 = require("@nestjs/cache-manager");
const jwt_auth_guard_1 = require("../../../../core/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../../core/guards/roles.guard");
const roles_decorator_1 = require("../../../../core/decorators/roles.decorator");
const current_user_decorator_1 = require("../../../../core/decorators/current-user.decorator");
const roles_enum_1 = require("../../../../core/enums/roles.enum");
let UserBookingsController = class UserBookingsController {
    createBooking;
    cancelBooking;
    getBookings;
    reviewBooking;
    trackBooking;
    paymentBooking;
    constructor(createBooking, cancelBooking, getBookings, reviewBooking, trackBooking, paymentBooking) {
        this.createBooking = createBooking;
        this.cancelBooking = cancelBooking;
        this.getBookings = getBookings;
        this.reviewBooking = reviewBooking;
        this.trackBooking = trackBooking;
        this.paymentBooking = paymentBooking;
    }
    async createInstant(userId, dto) {
        dto.isScheduled = false;
        const booking = await this.createBooking.execute(userId, dto);
        return { success: true, data: booking };
    }
    async createScheduled(userId, dto) {
        dto.isScheduled = true;
        const booking = await this.createBooking.execute(userId, dto);
        return { success: true, data: booking };
    }
    async getMyBookings(userId, skip, limit) {
        const bookings = await this.getBookings.getUserBookings(userId, skip || 0, limit || 10);
        return { success: true, ...bookings };
    }
    async getMyScheduledBookings(userId, skip, limit) {
        const bookings = await this.getBookings.getUserBookings(userId, skip || 0, limit || 10);
        return { success: true, ...bookings };
    }
    async getBooking(userId, id) {
        const booking = await this.getBookings.getBookingById(id);
        return { success: true, data: booking };
    }
    async cancelInstant(userId, id, reason) {
        const booking = await this.cancelBooking.execute(id, userId, reason || 'User requested cancellation', true);
        return { success: true, data: booking };
    }
    async cancelScheduled(userId, id, reason) {
        const booking = await this.cancelBooking.execute(id, userId, reason || 'User deleted scheduled appt', true);
        return { success: true, data: booking };
    }
    async review(user, id, rating, comment) {
        const booking = await this.reviewBooking.execute(user._id, id, rating, comment, user);
        return { success: true, data: booking };
    }
    async track(userId, id) {
        const tracking = await this.trackBooking.execute(userId, id);
        return { success: true, data: tracking };
    }
    async getPrice(userId, id) {
        const priceInfo = await this.paymentBooking.getPrice(id);
        return { success: true, data: priceInfo };
    }
    async pay(userId, id, method) {
        const booking = await this.paymentBooking.pay(userId, id, method);
        return { success: true, data: booking };
    }
    async usePoints(userId, id, points) {
        const booking = await this.paymentBooking.usePoints(userId, id, points);
        return { success: true, data: booking };
    }
};
exports.UserBookingsController = UserBookingsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_booking_dto_1.CreateBookingDto]),
    __metadata("design:returntype", Promise)
], UserBookingsController.prototype, "createInstant", null);
__decorate([
    (0, common_1.Post)('schedule'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_booking_dto_1.CreateBookingDto]),
    __metadata("design:returntype", Promise)
], UserBookingsController.prototype, "createScheduled", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, common_1.UseInterceptors)(cache_manager_1.CacheInterceptor),
    (0, cache_manager_1.CacheTTL)(60000),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('skip')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], UserBookingsController.prototype, "getMyBookings", null);
__decorate([
    (0, common_1.Get)('schedule/my'),
    (0, common_1.UseInterceptors)(cache_manager_1.CacheInterceptor),
    (0, cache_manager_1.CacheTTL)(60000),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('skip')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], UserBookingsController.prototype, "getMyScheduledBookings", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UserBookingsController.prototype, "getBooking", null);
__decorate([
    (0, common_1.Patch)(':id/cancel'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], UserBookingsController.prototype, "cancelInstant", null);
__decorate([
    (0, common_1.Delete)('schedule/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], UserBookingsController.prototype, "cancelScheduled", null);
__decorate([
    (0, common_1.Post)(':id/review'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('rating')),
    __param(3, (0, common_1.Body)('comment')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number, String]),
    __metadata("design:returntype", Promise)
], UserBookingsController.prototype, "review", null);
__decorate([
    (0, common_1.Get)(':id/track'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UserBookingsController.prototype, "track", null);
__decorate([
    (0, common_1.Get)(':id/price'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UserBookingsController.prototype, "getPrice", null);
__decorate([
    (0, common_1.Post)(':id/pay'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('method')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], UserBookingsController.prototype, "pay", null);
__decorate([
    (0, common_1.Post)(':id/use-points'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('points')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", Promise)
], UserBookingsController.prototype, "usePoints", null);
exports.UserBookingsController = UserBookingsController = __decorate([
    (0, common_1.Controller)('v1/bookings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.USER),
    __metadata("design:paramtypes", [create_booking_use_case_1.CreateBookingUseCase,
        cancel_booking_use_case_1.CancelBookingUseCase,
        get_bookings_use_case_1.GetBookingsUseCase,
        review_booking_use_case_1.ReviewBookingUseCase,
        track_booking_use_case_1.TrackBookingUseCase,
        payment_booking_use_case_1.PaymentBookingUseCase])
], UserBookingsController);
//# sourceMappingURL=user-bookings.controller.js.map