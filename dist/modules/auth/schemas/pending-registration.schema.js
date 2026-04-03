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
exports.PendingRegistrationSchema = exports.PendingRegistration = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let PendingRegistration = class PendingRegistration {
    phoneNumber;
    fullName;
    password;
    accountType;
    isTermsAccepted;
    otpCode;
    otpExpiresAt;
    otpAttempts;
    expiresAt;
};
exports.PendingRegistration = PendingRegistration;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, trim: true }),
    __metadata("design:type", String)
], PendingRegistration.prototype, "phoneNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], PendingRegistration.prototype, "fullName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, select: false }),
    __metadata("design:type", String)
], PendingRegistration.prototype, "password", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: ['customer', 'provider', 'admin'],
        default: 'customer',
    }),
    __metadata("design:type", String)
], PendingRegistration.prototype, "accountType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: false }),
    __metadata("design:type", Boolean)
], PendingRegistration.prototype, "isTermsAccepted", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null, select: false }),
    __metadata("design:type", Object)
], PendingRegistration.prototype, "otpCode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null, select: false }),
    __metadata("design:type", Object)
], PendingRegistration.prototype, "otpExpiresAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0, select: false }),
    __metadata("design:type", Number)
], PendingRegistration.prototype, "otpAttempts", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, expires: 600 }),
    __metadata("design:type", Date)
], PendingRegistration.prototype, "expiresAt", void 0);
exports.PendingRegistration = PendingRegistration = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'pending_registrations' })
], PendingRegistration);
exports.PendingRegistrationSchema = mongoose_1.SchemaFactory.createForClass(PendingRegistration);
//# sourceMappingURL=pending-registration.schema.js.map