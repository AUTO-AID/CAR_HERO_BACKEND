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
exports.CancelBookingUseCase = void 0;
const common_1 = require("@nestjs/common");
const booking_repository_interface_1 = require("../../domain/repositories/booking.repository.interface");
const booking_status_enum_1 = require("../../domain/enums/booking-status.enum");
const payment_status_enum_1 = require("../../domain/enums/payment-status.enum");
const transaction_entity_1 = require("../../../../modules/wallet/domain/entities/transaction.entity");
const status_enum_1 = require("../../../../core/enums/status.enum");
let CancelBookingUseCase = class CancelBookingUseCase {
    bookingRepository;
    walletRepository;
    constructor(bookingRepository, walletRepository) {
        this.bookingRepository = bookingRepository;
        this.walletRepository = walletRepository;
    }
    async execute(bookingId, cancelledBy, reason, isUser) {
        const booking = await this.bookingRepository.findById(bookingId);
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        if (isUser && booking.user !== cancelledBy) {
            throw new common_1.UnauthorizedException('You are not authorized to cancel this booking. Ownership mismatch.');
        }
        if (!isUser && booking.provider !== cancelledBy) {
            throw new common_1.UnauthorizedException('You are not authorized to cancel this booking. Assignment mismatch.');
        }
        const activeStatuses = [booking_status_enum_1.BookingStatus.ON_THE_WAY, booking_status_enum_1.BookingStatus.IN_PROGRESS, booking_status_enum_1.BookingStatus.COMPLETED];
        if (activeStatuses.includes(booking.status)) {
            throw new common_1.BadRequestException('Booking cannot be cancelled once the provider is on the way or has started work.');
        }
        if (booking.status === booking_status_enum_1.BookingStatus.CANCELLED) {
            throw new common_1.BadRequestException('Booking is already cancelled.');
        }
        booking.status = booking_status_enum_1.BookingStatus.CANCELLED;
        booking.cancelledAt = new Date();
        booking.cancelledBy = cancelledBy;
        booking.cancellationReason = reason;
        const updated = await this.bookingRepository.update(bookingId, {
            status: booking.status,
            cancelledAt: booking.cancelledAt,
            cancelledBy: booking.cancelledBy,
            cancellationReason: booking.cancellationReason,
        });
        if (booking.paymentStatus === payment_status_enum_1.PaymentStatus.PAID && booking.total > 0 && booking.user) {
            await this.walletRepository.executeTransaction(booking.user, 'user', async (wallet, session) => {
                const balanceBefore = wallet.balance;
                wallet.deposit(booking.total);
                const balanceAfter = wallet.balance;
                const transaction = new transaction_entity_1.Transaction(transaction_entity_1.Transaction.generateTransactionNumber(), wallet.id, wallet.ownerId, wallet.ownerType, status_enum_1.TransactionType.REFUND, booking.total, balanceBefore, balanceAfter, `Refund for cancelled booking #${booking.bookingNumber}`, undefined, 'booking', booking.id, undefined, undefined, 'completed');
                return { wallet, transaction };
            });
            await this.bookingRepository.update(bookingId, { paymentStatus: payment_status_enum_1.PaymentStatus.REFUNDED });
        }
        return updated;
    }
};
exports.CancelBookingUseCase = CancelBookingUseCase;
exports.CancelBookingUseCase = CancelBookingUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IBookingRepository')),
    __param(1, (0, common_1.Inject)('IWalletRepository')),
    __metadata("design:paramtypes", [Object, Object])
], CancelBookingUseCase);
//# sourceMappingURL=cancel-booking.use-case.js.map