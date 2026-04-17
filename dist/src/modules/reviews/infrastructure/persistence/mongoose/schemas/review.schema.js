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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewSchema = exports.Review = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let Review = class Review {
    user;
    provider;
    order;
    booking;
    rating;
    comment;
    serviceQuality;
    punctuality;
    professionalism;
    valueForMoney;
    images;
    isReported;
    reportReason;
    response;
};
exports.Review = Review;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Review.prototype, "user", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Provider', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Review.prototype, "provider", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Order' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Review.prototype, "order", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Booking' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Review.prototype, "booking", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 1, max: 5 }),
    __metadata("design:type", Number)
], Review.prototype, "rating", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Review.prototype, "comment", void 0);
__decorate([
    (0, mongoose_1.Prop)({ min: 1, max: 5 }),
    __metadata("design:type", Number)
], Review.prototype, "serviceQuality", void 0);
__decorate([
    (0, mongoose_1.Prop)({ min: 1, max: 5 }),
    __metadata("design:type", Number)
], Review.prototype, "punctuality", void 0);
__decorate([
    (0, mongoose_1.Prop)({ min: 1, max: 5 }),
    __metadata("design:type", Number)
], Review.prototype, "professionalism", void 0);
__decorate([
    (0, mongoose_1.Prop)({ min: 1, max: 5 }),
    __metadata("design:type", Number)
], Review.prototype, "valueForMoney", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Review.prototype, "images", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Review.prototype, "isReported", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Review.prototype, "reportReason", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            comment: String,
            repliedAt: { type: Date, default: Date.now },
        },
    }),
    __metadata("design:type", Object)
], Review.prototype, "response", void 0);
exports.Review = Review = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: function (doc, ret) {
                delete ret.__v;
                return ret;
            },
        },
    })
], Review);
exports.ReviewSchema = mongoose_1.SchemaFactory.createForClass(Review);
exports.ReviewSchema.index({ provider: 1, createdAt: -1 });
exports.ReviewSchema.index({ user: 1 });
exports.ReviewSchema.index({ order: 1 }, { unique: true, sparse: true });
exports.ReviewSchema.index({ booking: 1 }, { unique: true, sparse: true });
exports.ReviewSchema.index({ rating: -1 });
//# sourceMappingURL=review.schema.js.map