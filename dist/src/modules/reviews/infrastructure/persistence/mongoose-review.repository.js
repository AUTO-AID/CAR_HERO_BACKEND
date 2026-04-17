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
exports.MongooseReviewRepository = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const review_schema_1 = require("./mongoose/schemas/review.schema");
const review_mapper_1 = require("../mappers/review.mapper");
let MongooseReviewRepository = class MongooseReviewRepository {
    reviewModel;
    constructor(reviewModel) {
        this.reviewModel = reviewModel;
    }
    async create(review) {
        const persistence = review_mapper_1.ReviewMapper.toPersistence(review);
        const created = new this.reviewModel(persistence);
        const doc = await created.save();
        return review_mapper_1.ReviewMapper.toEntity(doc);
    }
    async findById(id) {
        const doc = await this.reviewModel.findById(id).exec();
        return doc ? review_mapper_1.ReviewMapper.toEntity(doc) : null;
    }
    async findByProvider(providerId, pagination) {
        const skip = (pagination.page - 1) * pagination.limit;
        const [docs, total] = await Promise.all([
            this.reviewModel.find({ provider: providerId, isVisible: true })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(pagination.limit)
                .exec(),
            this.reviewModel.countDocuments({ provider: providerId, isVisible: true }),
        ]);
        return {
            reviews: docs.map(doc => review_mapper_1.ReviewMapper.toEntity(doc)),
            total,
        };
    }
    async findByUser(userId, pagination) {
        const skip = (pagination.page - 1) * pagination.limit;
        const [docs, total] = await Promise.all([
            this.reviewModel.find({ user: userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(pagination.limit)
                .exec(),
            this.reviewModel.countDocuments({ user: userId }),
        ]);
        return {
            reviews: docs.map(doc => review_mapper_1.ReviewMapper.toEntity(doc)),
            total,
        };
    }
    async findByOrder(orderId) {
        const doc = await this.reviewModel.findOne({ order: orderId }).exec();
        return doc ? review_mapper_1.ReviewMapper.toEntity(doc) : null;
    }
    async findByBooking(bookingId) {
        const doc = await this.reviewModel.findOne({ booking: bookingId }).exec();
        return doc ? review_mapper_1.ReviewMapper.toEntity(doc) : null;
    }
    async update(id, data) {
        const doc = await this.reviewModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
        if (!doc)
            throw new Error('Review not found');
        return review_mapper_1.ReviewMapper.toEntity(doc);
    }
    async delete(id) {
        const result = await this.reviewModel.findByIdAndDelete(id).exec();
        return !!result;
    }
    async getAverageRating(providerId) {
        const stats = await this.reviewModel.aggregate([
            { $match: { provider: new mongoose_2.Types.ObjectId(providerId), isVisible: true } },
            {
                $group: {
                    _id: '$provider',
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                },
            },
        ]).exec();
        if (stats.length === 0) {
            return { averageRating: 0, totalReviews: 0 };
        }
        return {
            averageRating: Math.round(stats[0].averageRating * 10) / 10,
            totalReviews: stats[0].totalReviews,
        };
    }
};
exports.MongooseReviewRepository = MongooseReviewRepository;
exports.MongooseReviewRepository = MongooseReviewRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(review_schema_1.Review.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], MongooseReviewRepository);
//# sourceMappingURL=mongoose-review.repository.js.map