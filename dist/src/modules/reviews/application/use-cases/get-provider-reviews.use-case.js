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
exports.GetProviderReviewsUseCase = void 0;
const common_1 = require("@nestjs/common");
const review_repository_interface_1 = require("../../domain/repositories/review.repository.interface");
let GetProviderReviewsUseCase = class GetProviderReviewsUseCase {
    reviewRepository;
    constructor(reviewRepository) {
        this.reviewRepository = reviewRepository;
    }
    async execute(providerId, page = 1, limit = 10) {
        return this.reviewRepository.findByProvider(providerId, { page, limit });
    }
};
exports.GetProviderReviewsUseCase = GetProviderReviewsUseCase;
exports.GetProviderReviewsUseCase = GetProviderReviewsUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(review_repository_interface_1.IReviewRepository)),
    __metadata("design:paramtypes", [Object])
], GetProviderReviewsUseCase);
//# sourceMappingURL=get-provider-reviews.use-case.js.map