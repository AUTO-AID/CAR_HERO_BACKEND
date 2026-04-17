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
exports.DeleteReviewUseCase = void 0;
const common_1 = require("@nestjs/common");
const review_repository_interface_1 = require("../../domain/repositories/review.repository.interface");
const recalculate_provider_rating_use_case_1 = require("../../../providers/application/use-cases/recalculate-provider-rating.use-case");
let DeleteReviewUseCase = class DeleteReviewUseCase {
    reviewRepository;
    recalculateProviderRatingUseCase;
    constructor(reviewRepository, recalculateProviderRatingUseCase) {
        this.reviewRepository = reviewRepository;
        this.recalculateProviderRatingUseCase = recalculateProviderRatingUseCase;
    }
    async execute(reviewId, currentUser) {
        const review = await this.reviewRepository.findById(reviewId);
        if (!review) {
            throw new common_1.NotFoundException('Review not found');
        }
        if (review.user.toString() !== currentUser._id.toString() && currentUser.role !== 'admin') {
            throw new common_1.ForbiddenException('You do not have permission to delete this review');
        }
        const providerId = review.provider;
        const deleted = await this.reviewRepository.delete(reviewId);
        if (deleted) {
            const stats = await this.reviewRepository.getAverageRating(providerId);
            await this.recalculateProviderRatingUseCase.execute(providerId, stats.averageRating, stats.totalReviews);
        }
        return deleted;
    }
};
exports.DeleteReviewUseCase = DeleteReviewUseCase;
exports.DeleteReviewUseCase = DeleteReviewUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(review_repository_interface_1.IReviewRepository)),
    __metadata("design:paramtypes", [Object, recalculate_provider_rating_use_case_1.RecalculateProviderRatingUseCase])
], DeleteReviewUseCase);
//# sourceMappingURL=delete-review.use-case.js.map