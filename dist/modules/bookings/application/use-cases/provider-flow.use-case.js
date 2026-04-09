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
exports.ProviderFlowUseCase = void 0;
const common_1 = require("@nestjs/common");
const booking_repository_interface_1 = require("../../domain/repositories/booking.repository.interface");
const booking_status_enum_1 = require("../../domain/enums/booking-status.enum");
const app_gateway_1 = require("../../../gateway/app.gateway");
const transfer_earnings_use_case_1 = require("../../../../modules/wallet/application/use-cases/transfer-earnings.use-case");
let ProviderFlowUseCase = class ProviderFlowUseCase {
    bookingRepository;
    appGateway;
    transferEarnings;
    constructor(bookingRepository, appGateway, transferEarnings) {
        this.bookingRepository = bookingRepository;
        this.appGateway = appGateway;
        this.transferEarnings = transferEarnings;
    }
    async accept(providerId, bookingId) {
        const booking = await this.bookingRepository.findById(bookingId);
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        if (booking.status !== booking_status_enum_1.BookingStatus.PENDING)
            throw new common_1.BadRequestException('Booking is no longer available');
        const updated = await this.bookingRepository.update(bookingId, {
            provider: providerId,
            status: booking_status_enum_1.BookingStatus.ACCEPTED,
            confirmedAt: new Date(),
        });
        this.broadcastStatus(updated);
        return updated;
    }
    async reject(providerId, bookingId) {
        return await this.bookingRepository.findById(bookingId);
    }
    async start(providerId, bookingId) {
        const booking = await this.validateProviderAndStatus(providerId, bookingId, [booking_status_enum_1.BookingStatus.ACCEPTED, booking_status_enum_1.BookingStatus.ON_THE_WAY]);
        const updated = await this.bookingRepository.updateStatus(bookingId, booking_status_enum_1.BookingStatus.IN_PROGRESS);
        this.broadcastStatus(updated);
        return updated;
    }
    async complete(providerId, bookingId) {
        const booking = await this.validateProviderAndStatus(providerId, bookingId, [booking_status_enum_1.BookingStatus.IN_PROGRESS]);
        const updated = await this.bookingRepository.updateStatus(bookingId, booking_status_enum_1.BookingStatus.COMPLETED);
        if (updated.total > 0) {
            await this.transferEarnings.execute(providerId, updated.total, updated.id, 'booking');
        }
        this.broadcastStatus(updated);
        return updated;
    }
    async validateProviderAndStatus(providerId, bookingId, allowedStatuses) {
        const booking = await this.bookingRepository.findById(bookingId);
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        if (booking.provider !== providerId)
            throw new common_1.BadRequestException('Unauthorized for this booking');
        if (!allowedStatuses.includes(booking.status))
            throw new common_1.BadRequestException(`Cannot perform action from status: ${booking.status}`);
        return booking;
    }
    broadcastStatus(booking) {
        const room = `order:${booking.id}`;
        this.appGateway.server.to(room).emit(app_gateway_1.ServerEvents.ORDER_STATUS_UPDATED, {
            orderId: booking.id,
            bookingNumber: booking.bookingNumber,
            status: booking.status,
            timestamp: new Date().toISOString(),
        });
    }
};
exports.ProviderFlowUseCase = ProviderFlowUseCase;
exports.ProviderFlowUseCase = ProviderFlowUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IBookingRepository')),
    __metadata("design:paramtypes", [Object, app_gateway_1.AppGateway,
        transfer_earnings_use_case_1.TransferEarningsUseCase])
], ProviderFlowUseCase);
//# sourceMappingURL=provider-flow.use-case.js.map