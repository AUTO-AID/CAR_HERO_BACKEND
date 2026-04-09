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
exports.ReviewOrderUseCase = void 0;
const common_1 = require("@nestjs/common");
const order_repository_interface_1 = require("../../domain/repositories/order.repository.interface");
const status_enum_1 = require("../../../../common/enums/status.enum");
let ReviewOrderUseCase = class ReviewOrderUseCase {
    orderRepository;
    constructor(orderRepository) {
        this.orderRepository = orderRepository;
    }
    async execute(id, dto, currentUser) {
        const order = await this.orderRepository.findById(id);
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        const isOwner = order.userId?.toString() === currentUser._id?.toString();
        const isAdmin = currentUser.role === 'admin';
        if (!isOwner && !isAdmin) {
            throw new common_1.ForbiddenException('You do not have permission to review this order');
        }
        if (order.status !== status_enum_1.OrderStatus.COMPLETED) {
            throw new common_1.BadRequestException('Review is only allowed for completed orders');
        }
        if (order.rating) {
            throw new common_1.BadRequestException('Order already has a review');
        }
        return this.orderRepository.addReview(id, dto.rating, dto.comment);
    }
};
exports.ReviewOrderUseCase = ReviewOrderUseCase;
exports.ReviewOrderUseCase = ReviewOrderUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(order_repository_interface_1.IOrderRepository)),
    __metadata("design:paramtypes", [Object])
], ReviewOrderUseCase);
//# sourceMappingURL=review-order.use-case.js.map