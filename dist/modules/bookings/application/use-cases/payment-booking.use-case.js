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
exports.PaymentBookingUseCase = void 0;
const common_1 = require("@nestjs/common");
const booking_repository_interface_1 = require("../../domain/repositories/booking.repository.interface");
const payment_status_enum_1 = require("../../domain/enums/payment-status.enum");
let PaymentBookingUseCase = class PaymentBookingUseCase {
    bookingRepository;
    constructor(bookingRepository) {
        this.bookingRepository = bookingRepository;
    }
    async getPrice(bookingId) {
        const booking = await this.bookingRepository.findById(bookingId);
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        return {
            total: booking.total,
            subtotal: booking.subtotal,
            breakdown: { tax: booking.tax, discount: booking.discount }
        };
    }
    async pay(userId, bookingId, method) {
        return await this.bookingRepository.update(bookingId, {
            paymentStatus: payment_status_enum_1.PaymentStatus.PAID,
            paymentMethod: method,
        });
    }
    async usePoints(userId, bookingId, points) {
        const booking = await this.bookingRepository.findById(bookingId);
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        const discountAmount = points * 0.5;
        const newTotal = Math.max(0, booking.total - discountAmount);
        return await this.bookingRepository.update(bookingId, {
            discount: (booking.discount || 0) + discountAmount,
            total: newTotal,
            userNotes: (booking.userNotes || '') + ` (Used ${points} points)`
        });
    }
};
exports.PaymentBookingUseCase = PaymentBookingUseCase;
exports.PaymentBookingUseCase = PaymentBookingUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IBookingRepository')),
    __metadata("design:paramtypes", [Object])
], PaymentBookingUseCase);
//# sourceMappingURL=payment-booking.use-case.js.map