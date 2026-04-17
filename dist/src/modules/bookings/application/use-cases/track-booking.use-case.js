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
exports.TrackBookingUseCase = void 0;
const common_1 = require("@nestjs/common");
const booking_repository_interface_1 = require("../../domain/repositories/booking.repository.interface");
let TrackBookingUseCase = class TrackBookingUseCase {
    bookingRepository;
    constructor(bookingRepository) {
        this.bookingRepository = bookingRepository;
    }
    async execute(userId, bookingId) {
        const booking = await this.bookingRepository.findById(bookingId);
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        return {
            status: booking.status,
            providerId: booking.provider,
            estimatedArrival: '15 mins',
            location: booking.location,
        };
    }
};
exports.TrackBookingUseCase = TrackBookingUseCase;
exports.TrackBookingUseCase = TrackBookingUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IBookingRepository')),
    __metadata("design:paramtypes", [Object])
], TrackBookingUseCase);
//# sourceMappingURL=track-booking.use-case.js.map