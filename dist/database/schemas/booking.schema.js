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
exports.BookingSchema = exports.Booking = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const status_enum_1 = require("../../common/enums/status.enum");
let Booking = class Booking {
    bookingNumber;
    user;
    provider;
    vehicle;
    service;
    status;
    scheduledDate;
    scheduledTime;
    estimatedDuration;
    serviceName;
    servicePrice;
    selectedOptions;
    subtotal;
    discount;
    tax;
    total;
    promoCode;
    paymentStatus;
    paymentMethod;
    paymentId;
    confirmedAt;
    startedAt;
    completedAt;
    cancelledAt;
    cancellationReason;
    cancelledBy;
    userNotes;
    providerNotes;
    reminderEnabled;
    reminderSentAt;
    rating;
    review;
    metadata;
};
exports.Booking = Booking;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Booking.prototype, "bookingNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Booking.prototype, "user", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Provider', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Booking.prototype, "provider", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Vehicle' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Booking.prototype, "vehicle", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Service', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Booking.prototype, "service", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: status_enum_1.BookingStatus, default: status_enum_1.BookingStatus.PENDING }),
    __metadata("design:type", String)
], Booking.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], Booking.prototype, "scheduledDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Booking.prototype, "scheduledTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Booking.prototype, "estimatedDuration", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Booking.prototype, "serviceName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Booking.prototype, "servicePrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Object], default: [] }),
    __metadata("design:type", Array)
], Booking.prototype, "selectedOptions", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Booking.prototype, "subtotal", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Booking.prototype, "discount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Booking.prototype, "tax", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Booking.prototype, "total", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Booking.prototype, "promoCode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: status_enum_1.PaymentStatus, default: status_enum_1.PaymentStatus.PENDING }),
    __metadata("design:type", String)
], Booking.prototype, "paymentStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'cash' }),
    __metadata("design:type", String)
], Booking.prototype, "paymentMethod", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Booking.prototype, "paymentId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Booking.prototype, "confirmedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Booking.prototype, "startedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Booking.prototype, "completedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Booking.prototype, "cancelledAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Booking.prototype, "cancellationReason", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Booking.prototype, "cancelledBy", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Booking.prototype, "userNotes", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Booking.prototype, "providerNotes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Booking.prototype, "reminderEnabled", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Booking.prototype, "reminderSentAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ min: 1, max: 5 }),
    __metadata("design:type", Number)
], Booking.prototype, "rating", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Review' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Booking.prototype, "review", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], Booking.prototype, "metadata", void 0);
exports.Booking = Booking = __decorate([
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
], Booking);
exports.BookingSchema = mongoose_1.SchemaFactory.createForClass(Booking);
exports.BookingSchema.index({ bookingNumber: 1 }, { unique: true });
exports.BookingSchema.index({ user: 1, scheduledDate: -1 });
exports.BookingSchema.index({ provider: 1, scheduledDate: -1 });
exports.BookingSchema.index({ status: 1 });
exports.BookingSchema.index({ scheduledDate: 1 });
//# sourceMappingURL=booking.schema.js.map