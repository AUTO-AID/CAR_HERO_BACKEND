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
exports.UserSubscriptionSchema = exports.UserSubscription = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const subscription_plan_schema_1 = require("./subscription-plan.schema");
let UserSubscription = class UserSubscription {
    user;
    plan;
    startDate;
    endDate;
    status;
    autoRenew;
    cancelledAt;
    lastPaymentId;
    amountPaid;
    metadata;
};
exports.UserSubscription = UserSubscription;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], UserSubscription.prototype, "user", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: subscription_plan_schema_1.SubscriptionPlan.name, required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], UserSubscription.prototype, "plan", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], UserSubscription.prototype, "startDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], UserSubscription.prototype, "endDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: ['active', 'expired', 'cancelled', 'pending'], default: 'active' }),
    __metadata("design:type", String)
], UserSubscription.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], UserSubscription.prototype, "autoRenew", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], UserSubscription.prototype, "cancelledAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], UserSubscription.prototype, "lastPaymentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], UserSubscription.prototype, "amountPaid", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], UserSubscription.prototype, "metadata", void 0);
exports.UserSubscription = UserSubscription = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        collection: 'user_subscriptions',
        toJSON: {
            virtuals: true,
            transform: function (doc, ret) {
                delete ret.__v;
                return ret;
            },
        },
    })
], UserSubscription);
exports.UserSubscriptionSchema = mongoose_1.SchemaFactory.createForClass(UserSubscription);
exports.UserSubscriptionSchema.index({ user: 1, status: 1 });
exports.UserSubscriptionSchema.index({ endDate: 1 });
exports.UserSubscriptionSchema.index({ plan: 1 });
//# sourceMappingURL=user-subscription.schema.js.map