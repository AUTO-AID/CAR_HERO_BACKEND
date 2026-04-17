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
exports.ReviewsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const create_review_use_case_1 = require("../../application/use-cases/create-review.use-case");
const get_provider_reviews_use_case_1 = require("../../application/use-cases/get-provider-reviews.use-case");
const respond_to_review_use_case_1 = require("../../application/use-cases/respond-to-review.use-case");
const delete_review_use_case_1 = require("../../application/use-cases/delete-review.use-case");
const review_dto_1 = require("../dtos/review.dto");
const jwt_auth_guard_1 = require("../../../../core/guards/jwt-auth.guard");
let ReviewsController = class ReviewsController {
    createReviewUseCase;
    getProviderReviewsUseCase;
    respondToReviewUseCase;
    deleteReviewUseCase;
    constructor(createReviewUseCase, getProviderReviewsUseCase, respondToReviewUseCase, deleteReviewUseCase) {
        this.createReviewUseCase = createReviewUseCase;
        this.getProviderReviewsUseCase = getProviderReviewsUseCase;
        this.respondToReviewUseCase = respondToReviewUseCase;
        this.deleteReviewUseCase = deleteReviewUseCase;
    }
    async createReview(dto, req) {
        return this.createReviewUseCase.execute(dto, req.user);
    }
    async getProviderReviews(providerId, query) {
        return this.getProviderReviewsUseCase.execute(providerId, query.page, query.limit);
    }
    async respondToReview(id, dto, req) {
        return this.respondToReviewUseCase.execute(id, dto.response, req.user);
    }
    async deleteReview(id, req) {
        return this.deleteReviewUseCase.execute(id, req.user);
    }
};
exports.ReviewsController = ReviewsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new review for an order or booking' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [review_dto_1.CreateReviewDto, Object]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "createReview", null);
__decorate([
    (0, common_1.Get)('provider/:providerId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all reviews for a specific provider' }),
    __param(0, (0, common_1.Param)('providerId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, review_dto_1.ReviewQueryDto]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "getProviderReviews", null);
__decorate([
    (0, common_1.Patch)(':id/respond'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Provider response to a review' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, review_dto_1.ProviderResponseDto, Object]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "respondToReview", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a review' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "deleteReview", null);
exports.ReviewsController = ReviewsController = __decorate([
    (0, swagger_1.ApiTags)('Reviews'),
    (0, common_1.Controller)('reviews'),
    __metadata("design:paramtypes", [create_review_use_case_1.CreateReviewUseCase,
        get_provider_reviews_use_case_1.GetProviderReviewsUseCase,
        respond_to_review_use_case_1.RespondToReviewUseCase,
        delete_review_use_case_1.DeleteReviewUseCase])
], ReviewsController);
//# sourceMappingURL=reviews.controller.js.map