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
exports.CreateReviewUseCase = void 0;
const common_1 = require("@nestjs/common");
const review_repository_interface_1 = require("../../domain/repositories/review.repository.interface");
const review_entity_1 = require("../../domain/entities/review.entity");
const order_repository_interface_1 = require("../../../orders/domain/repositories/order.repository.interface");
const booking_repository_interface_1 = require("../../../bookings/domain/repositories/booking.repository.interface");
const update_provider_rating_use_case_1 = require("../../../providers/application/use-cases/update-provider-rating.use-case");
const status_enum_1 = require("../../../../core/enums/status.enum");
let CreateReviewUseCase = class CreateReviewUseCase {
    reviewRepository;
    orderRepository;
    bookingRepository;
    updateProviderRatingUseCase;
    constructor(reviewRepository, orderRepository, bookingRepository, updateProviderRatingUseCase) {
        this.reviewRepository = reviewRepository;
        this.orderRepository = orderRepository;
        this.bookingRepository = bookingRepository;
        this.updateProviderRatingUseCase = updateProviderRatingUseCase;
    }
    async execute(dto, currentUser) {
        if (!dto.orderId && !dto.bookingId) {
            throw new common_1.BadRequestException('Either orderId or bookingId is required');
        }
        let providerId;
        let userId;
        if (dto.orderId) {
            const order = await this.orderRepository.findById(dto.orderId);
            if (!order)
                throw new common_1.NotFoundException('Order not found');
            if (order.userId.toString() !== currentUser._id.toString() && currentUser.role !== 'admin') {
                throw new common_1.ForbiddenException('You do not have permission to review this order');
            }
            if (order.status !== status_enum_1.OrderStatus.COMPLETED) {
                throw new common_1.BadRequestException('Order must be completed before reviewing');
            }
            const existing = await this.reviewRepository.findByOrder(dto.orderId);
            if (existing)
                throw new common_1.BadRequestException('Review already exists for this order');
            providerId = order.providerId;
            userId = order.userId;
        }
        else {
            const booking = await this.bookingRepository.findById(dto.bookingId);
            if (!booking)
                throw new common_1.NotFoundException('Booking not found');
            if (booking.userId.toString() !== currentUser._id.toString() && currentUser.role !== 'admin') {
                throw new common_1.ForbiddenException('You do not have permission to review this booking');
            }
            if (booking.status !== status_enum_1.BookingStatus.COMPLETED) {
                throw new common_1.BadRequestException('Booking must be completed before reviewing');
            }
            const existing = await this.reviewRepository.findByBooking(dto.bookingId);
            if (existing)
                throw new common_1.BadRequestException('Review already exists for this booking');
            providerId = booking.providerId;
            userId = booking.userId;
        }
        if (!providerId)
            throw new common_1.BadRequestException('No provider associated with this transaction');
        const review = review_entity_1.ReviewEntity.create({
            user: userId,
            provider: providerId,
            rating: dto.rating,
            order: dto.orderId,
            booking: dto.bookingId,
            comment: dto.comment,
            serviceQuality: dto.serviceQuality,
            punctuality: dto.punctuality,
            professionalism: dto.professionalism,
            valueForMoney: dto.valueForMoney,
            images: dto.images,
        });
        const savedReview = await this.reviewRepository.create(review);
        if (dto.orderId) {
            await this.orderRepository.update(dto.orderId, {
                rating: dto.rating,
            });
        }
        else {
            await this.bookingRepository.update(dto.bookingId, {
                rating: dto.rating
            });
        }
        await this.updateProviderRatingUseCase.execute(providerId, dto.rating);
        return savedReview;
    }
};
exports.CreateReviewUseCase = CreateReviewUseCase;
exports.CreateReviewUseCase = CreateReviewUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(review_repository_interface_1.IReviewRepository)),
    __param(1, (0, common_1.Inject)(order_repository_interface_1.IOrderRepository)),
    __param(2, (0, common_1.Inject)(booking_repository_interface_1.IBookingRepository)),
    __metadata("design:paramtypes", [Object, Object, Object, update_provider_rating_use_case_1.UpdateProviderRatingUseCase])
], CreateReviewUseCase);
//# sourceMappingURL=create-review.use-case.js.map