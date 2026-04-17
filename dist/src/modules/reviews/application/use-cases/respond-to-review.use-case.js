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
exports.RespondToReviewUseCase = void 0;
const common_1 = require("@nestjs/common");
const review_repository_interface_1 = require("../../domain/repositories/review.repository.interface");
let RespondToReviewUseCase = class RespondToReviewUseCase {
    reviewRepository;
    constructor(reviewRepository) {
        this.reviewRepository = reviewRepository;
    }
    async execute(reviewId, response, currentUser) {
        const review = await this.reviewRepository.findById(reviewId);
        if (!review) {
            throw new common_1.NotFoundException('Review not found');
        }
        if (review.provider.toString() !== currentUser.providerId?.toString() && currentUser.role !== 'admin') {
            throw new common_1.ForbiddenException('You do not have permission to respond to this review');
        }
        return this.reviewRepository.update(reviewId, {
            providerResponse: response,
            providerRespondedAt: new Date(),
        });
    }
};
exports.RespondToReviewUseCase = RespondToReviewUseCase;
exports.RespondToReviewUseCase = RespondToReviewUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(review_repository_interface_1.IReviewRepository)),
    __metadata("design:paramtypes", [Object])
], RespondToReviewUseCase);
//# sourceMappingURL=respond-to-review.use-case.js.map