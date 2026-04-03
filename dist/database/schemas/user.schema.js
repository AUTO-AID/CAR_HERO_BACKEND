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
exports.UserSchema = exports.User = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const roles_enum_1 = require("../../common/enums/roles.enum");
let User = class User {
    fullName;
    phoneNumber;
    password;
    profileImage;
    accountType;
    role;
    pointsBalance;
    loyaltyLevel;
    isPremium;
    premiumExpiresAt;
    preferences;
    isActive;
    isTermsAccepted;
    isVerified;
    lastLoginAt;
    otpCode;
    otpExpiresAt;
    otpAttempts;
    refreshToken;
    fcmToken;
    vehicles;
    activeSubscription;
    walletBalance;
    loyaltyPoints;
};
exports.User = User;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], User.prototype, "fullName", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        unique: true,
        match: [/^\+963\d{9}$/, 'Phone number must start with +963 followed by 9 digits'],
    }),
    __metadata("design:type", String)
], User.prototype, "phoneNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, select: false }),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], User.prototype, "profileImage", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: ['customer', 'provider', 'admin'],
        default: 'customer',
    }),
    __metadata("design:type", String)
], User.prototype, "accountType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: roles_enum_1.Role, default: roles_enum_1.Role.USER }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0, min: 0 }),
    __metadata("design:type", Number)
], User.prototype, "pointsBalance", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 1, min: 1 }),
    __metadata("design:type", Number)
], User.prototype, "loyaltyLevel", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isPremium", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], User.prototype, "premiumExpiresAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            language: { type: String, default: 'ar', enum: ['ar', 'en'] },
            notifications: {
                push: { type: Boolean, default: true },
                sms: { type: Boolean, default: true },
                email: { type: Boolean, default: false },
            },
        },
        default: () => ({
            language: 'ar',
            notifications: { push: true, sms: true, email: false },
        }),
    }),
    __metadata("design:type", Object)
], User.prototype, "preferences", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], User.prototype, "isActive", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isTermsAccepted", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isVerified", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], User.prototype, "lastLoginAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null, select: false }),
    __metadata("design:type", Object)
], User.prototype, "otpCode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null, select: false }),
    __metadata("design:type", Object)
], User.prototype, "otpExpiresAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0, select: false }),
    __metadata("design:type", Number)
], User.prototype, "otpAttempts", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null, select: false }),
    __metadata("design:type", Object)
], User.prototype, "refreshToken", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], User.prototype, "fcmToken", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ type: mongoose_2.Types.ObjectId, ref: 'Vehicle' }] }),
    __metadata("design:type", Array)
], User.prototype, "vehicles", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Subscription' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], User.prototype, "activeSubscription", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "walletBalance", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "loyaltyPoints", void 0);
exports.User = User = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        collection: 'users',
        toJSON: {
            virtuals: true,
            transform: function (doc, ret) {
                delete ret.password;
                delete ret.otpCode;
                delete ret.otpExpiresAt;
                delete ret.otpAttempts;
                delete ret.refreshToken;
                delete ret.__v;
                return ret;
            },
        },
    })
], User);
exports.UserSchema = mongoose_1.SchemaFactory.createForClass(User);
exports.UserSchema.index({ phoneNumber: 1 }, { unique: true });
exports.UserSchema.index({ accountType: 1 });
exports.UserSchema.index({ isPremium: 1, premiumExpiresAt: 1 });
exports.UserSchema.index({ isActive: 1, isVerified: 1 });
exports.UserSchema.index({ createdAt: -1 });
//# sourceMappingURL=user.schema.js.map