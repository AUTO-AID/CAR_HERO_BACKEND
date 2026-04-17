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
exports.SubscriptionPlanSchema = exports.SubscriptionPlan = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let SubscriptionPlan = class SubscriptionPlan {
    name;
    nameAr;
    description;
    descriptionAr;
    price;
    durationDays;
    features;
    featuresAr;
    isActive;
    tier;
    sortOrder;
    metadata;
};
exports.SubscriptionPlan = SubscriptionPlan;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], SubscriptionPlan.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], SubscriptionPlan.prototype, "nameAr", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], SubscriptionPlan.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], SubscriptionPlan.prototype, "descriptionAr", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], SubscriptionPlan.prototype, "price", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 1 }),
    __metadata("design:type", Number)
], SubscriptionPlan.prototype, "durationDays", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], SubscriptionPlan.prototype, "features", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], SubscriptionPlan.prototype, "featuresAr", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], SubscriptionPlan.prototype, "isActive", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: ['basic', 'silver', 'gold', 'platinum'], default: 'basic' }),
    __metadata("design:type", String)
], SubscriptionPlan.prototype, "tier", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], SubscriptionPlan.prototype, "sortOrder", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], SubscriptionPlan.prototype, "metadata", void 0);
exports.SubscriptionPlan = SubscriptionPlan = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        collection: 'subscription_plans',
        toJSON: {
            virtuals: true,
            transform: function (doc, ret) {
                delete ret.__v;
                return ret;
            },
        },
    })
], SubscriptionPlan);
exports.SubscriptionPlanSchema = mongoose_1.SchemaFactory.createForClass(SubscriptionPlan);
exports.SubscriptionPlanSchema.index({ isActive: 1 });
exports.SubscriptionPlanSchema.index({ tier: 1 });
exports.SubscriptionPlanSchema.index({ sortOrder: 1 });
//# sourceMappingURL=subscription-plan.schema.js.map