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
exports.PromoCodeSchema = exports.PromoCode = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let PromoCode = class PromoCode {
    code;
    type;
    value;
    expiryDate;
    usageLimit;
    usageCount;
    minOrderAmount;
    isActive;
    applicableServices;
};
exports.PromoCode = PromoCode;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, uppercase: true, trim: true }),
    __metadata("design:type", String)
], PromoCode.prototype, "code", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['percentage', 'fixed'] }),
    __metadata("design:type", String)
], PromoCode.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], PromoCode.prototype, "value", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], PromoCode.prototype, "expiryDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PromoCode.prototype, "usageLimit", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PromoCode.prototype, "usageCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ min: 0 }),
    __metadata("design:type", Number)
], PromoCode.prototype, "minOrderAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], PromoCode.prototype, "isActive", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], PromoCode.prototype, "applicableServices", void 0);
exports.PromoCode = PromoCode = __decorate([
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
], PromoCode);
exports.PromoCodeSchema = mongoose_1.SchemaFactory.createForClass(PromoCode);
exports.PromoCodeSchema.index({ code: 1 }, { unique: true });
exports.PromoCodeSchema.index({ isActive: 1, expiryDate: 1 });
//# sourceMappingURL=promo-code.schema.js.map