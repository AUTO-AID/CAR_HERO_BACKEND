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
exports.ProviderSchema = exports.Provider = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const roles_enum_1 = require("../../../../../../core/enums/roles.enum");
const status_enum_1 = require("../../../../../../core/enums/status.enum");
let GeoLocation = class GeoLocation {
    type;
    coordinates;
};
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: ['Point'], default: 'Point' }),
    __metadata("design:type", String)
], GeoLocation.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Number], required: true }),
    __metadata("design:type", Array)
], GeoLocation.prototype, "coordinates", void 0);
GeoLocation = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], GeoLocation);
let WorkingHours = class WorkingHours {
    day;
    open;
    close;
    isClosed;
};
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], WorkingHours.prototype, "day", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], WorkingHours.prototype, "open", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], WorkingHours.prototype, "close", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], WorkingHours.prototype, "isClosed", void 0);
WorkingHours = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], WorkingHours);
let BankAccount = class BankAccount {
    bankName;
    accountNumber;
    iban;
    accountHolderName;
};
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], BankAccount.prototype, "bankName", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], BankAccount.prototype, "accountNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], BankAccount.prototype, "iban", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], BankAccount.prototype, "accountHolderName", void 0);
BankAccount = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], BankAccount);
let Provider = class Provider {
    phone;
    email;
    businessName;
    ownerName;
    description;
    logo;
    images;
    role;
    status;
    registrationStatus;
    rejectionReason;
    isApproved;
    isActive;
    location;
    address;
    city;
    state;
    country;
    postalCode;
    serviceCategories;
    services;
    workingHours;
    averageRating;
    totalReviews;
    totalOrders;
    otp;
    otpExpiry;
    refreshToken;
    fcmToken;
    documents;
    bankAccount;
    commissionRate;
    walletBalance;
    lastOnlineAt;
};
exports.Provider = Provider;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Provider.prototype, "phone", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Provider.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Provider.prototype, "businessName", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Provider.prototype, "ownerName", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Provider.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Provider.prototype, "logo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Provider.prototype, "images", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: roles_enum_1.Role, default: roles_enum_1.Role.PROVIDER }),
    __metadata("design:type", String)
], Provider.prototype, "role", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: status_enum_1.ProviderStatus, default: status_enum_1.ProviderStatus.OFFLINE }),
    __metadata("design:type", String)
], Provider.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: status_enum_1.RegistrationStatus, default: status_enum_1.RegistrationStatus.PENDING }),
    __metadata("design:type", String)
], Provider.prototype, "registrationStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Provider.prototype, "rejectionReason", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Provider.prototype, "isApproved", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Provider.prototype, "isActive", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: GeoLocation, required: true }),
    __metadata("design:type", GeoLocation)
], Provider.prototype, "location", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Provider.prototype, "address", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Provider.prototype, "city", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Provider.prototype, "state", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Provider.prototype, "country", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Provider.prototype, "postalCode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], enum: status_enum_1.ServiceCategory, default: [] }),
    __metadata("design:type", Array)
], Provider.prototype, "serviceCategories", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ type: mongoose_2.Types.ObjectId, ref: 'Service' }] }),
    __metadata("design:type", Array)
], Provider.prototype, "services", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [WorkingHours], default: [] }),
    __metadata("design:type", Array)
], Provider.prototype, "workingHours", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Provider.prototype, "averageRating", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Provider.prototype, "totalReviews", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Provider.prototype, "totalOrders", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Provider.prototype, "otp", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Provider.prototype, "otpExpiry", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Provider.prototype, "refreshToken", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Provider.prototype, "fcmToken", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Provider.prototype, "documents", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: BankAccount }),
    __metadata("design:type", BankAccount)
], Provider.prototype, "bankAccount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 10 }),
    __metadata("design:type", Number)
], Provider.prototype, "commissionRate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Provider.prototype, "walletBalance", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Provider.prototype, "lastOnlineAt", void 0);
exports.Provider = Provider = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: function (doc, ret) {
                delete ret.otp;
                delete ret.otpExpiry;
                delete ret.refreshToken;
                delete ret.__v;
                return ret;
            },
        },
    })
], Provider);
exports.ProviderSchema = mongoose_1.SchemaFactory.createForClass(Provider);
exports.ProviderSchema.index({ location: '2dsphere' });
exports.ProviderSchema.index({ phone: 1 }, { unique: true });
exports.ProviderSchema.index({ status: 1 });
exports.ProviderSchema.index({ serviceCategories: 1 });
exports.ProviderSchema.index({ isActive: 1, isApproved: 1 });
exports.ProviderSchema.index({ averageRating: -1 });
exports.ProviderSchema.index({ createdAt: -1 });
//# sourceMappingURL=provider.schema.js.map