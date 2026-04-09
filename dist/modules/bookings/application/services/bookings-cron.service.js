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
var BookingsCronService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsCronService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const booking_repository_interface_1 = require("../../domain/repositories/booking.repository.interface");
const cancel_booking_use_case_1 = require("../use-cases/cancel-booking.use-case");
const common_2 = require("@nestjs/common");
let BookingsCronService = BookingsCronService_1 = class BookingsCronService {
    bookingRepository;
    cancelBookingUseCase;
    logger = new common_1.Logger(BookingsCronService_1.name);
    constructor(bookingRepository, cancelBookingUseCase) {
        this.bookingRepository = bookingRepository;
        this.cancelBookingUseCase = cancelBookingUseCase;
    }
    async handleStaleBookings() {
        this.logger.log('Running cron job to cancel stale pending bookings...');
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const staleBookings = await this.bookingRepository.findPendingOlderThan(twoHoursAgo);
        if (staleBookings.length === 0) {
            this.logger.log('No stale bookings found.');
            return;
        }
        this.logger.log(`Found ${staleBookings.length} stale bookings. Cancelling...`);
        let cancelledCount = 0;
        for (const booking of staleBookings) {
            try {
                await this.cancelBookingUseCase.execute(booking.id, 'SYSTEM_CRON', 'Auto-cancelled: No provider accepted the booking within 2 hours.', false);
                cancelledCount++;
            }
            catch (error) {
                this.logger.error(`Failed to cancel booking ${booking.id}: ${error.message}`);
            }
        }
        this.logger.log(`Successfully cancelled ${cancelledCount} stale bookings.`);
    }
};
exports.BookingsCronService = BookingsCronService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_10_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BookingsCronService.prototype, "handleStaleBookings", null);
exports.BookingsCronService = BookingsCronService = BookingsCronService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_2.Inject)('IBookingRepository')),
    __metadata("design:paramtypes", [Object, cancel_booking_use_case_1.CancelBookingUseCase])
], BookingsCronService);
//# sourceMappingURL=bookings-cron.service.js.map