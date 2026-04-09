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
exports.BookingSchema = exports.BookingDocument = exports.LocationSchema = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const booking_status_enum_1 = require("../../domain/enums/booking-status.enum");
const payment_status_enum_1 = require("../../domain/enums/payment-status.enum");
let LocationSchema = class LocationSchema {
    type;
    coordinates;
    address;
};
exports.LocationSchema = LocationSchema;
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: ['Point'], default: 'Point' }),
    __metadata("design:type", String)
], LocationSchema.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Number], required: true }),
    __metadata("design:type", Array)
], LocationSchema.prototype, "coordinates", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], LocationSchema.prototype, "address", void 0);
exports.LocationSchema = LocationSchema = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], LocationSchema);
let BookingDocument = class BookingDocument extends mongoose_2.Document {
    bookingNumber;
    isScheduled;
    user;
    provider;
    vehicle;
    service;
    status;
    location;
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
exports.BookingDocument = BookingDocument;
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, unique: true }),
    __metadata("design:type", String)
], BookingDocument.prototype, "bookingNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], BookingDocument.prototype, "isScheduled", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], BookingDocument.prototype, "user", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Provider' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], BookingDocument.prototype, "provider", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Vehicle' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], BookingDocument.prototype, "vehicle", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Service', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], BookingDocument.prototype, "service", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: booking_status_enum_1.BookingStatus, default: booking_status_enum_1.BookingStatus.PENDING }),
    __metadata("design:type", String)
], BookingDocument.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: LocationSchema, required: true }),
    __metadata("design:type", LocationSchema)
], BookingDocument.prototype, "location", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], BookingDocument.prototype, "scheduledDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], BookingDocument.prototype, "scheduledTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number }),
    __metadata("design:type", Number)
], BookingDocument.prototype, "estimatedDuration", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], BookingDocument.prototype, "serviceName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true }),
    __metadata("design:type", Number)
], BookingDocument.prototype, "servicePrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ name: String, price: Number }], default: [] }),
    __metadata("design:type", Array)
], BookingDocument.prototype, "selectedOptions", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true }),
    __metadata("design:type", Number)
], BookingDocument.prototype, "subtotal", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], BookingDocument.prototype, "discount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], BookingDocument.prototype, "tax", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true }),
    __metadata("design:type", Number)
], BookingDocument.prototype, "total", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], BookingDocument.prototype, "promoCode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: payment_status_enum_1.PaymentStatus, default: payment_status_enum_1.PaymentStatus.PENDING }),
    __metadata("design:type", String)
], BookingDocument.prototype, "paymentStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], BookingDocument.prototype, "paymentMethod", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], BookingDocument.prototype, "paymentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], BookingDocument.prototype, "confirmedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], BookingDocument.prototype, "startedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], BookingDocument.prototype, "completedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], BookingDocument.prototype, "cancelledAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], BookingDocument.prototype, "cancellationReason", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], BookingDocument.prototype, "cancelledBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], BookingDocument.prototype, "userNotes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], BookingDocument.prototype, "providerNotes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], BookingDocument.prototype, "reminderEnabled", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], BookingDocument.prototype, "reminderSentAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number }),
    __metadata("design:type", Number)
], BookingDocument.prototype, "rating", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Review' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], BookingDocument.prototype, "review", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], BookingDocument.prototype, "metadata", void 0);
exports.BookingDocument = BookingDocument = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], BookingDocument);
exports.BookingSchema = mongoose_1.SchemaFactory.createForClass(BookingDocument);
exports.BookingSchema.index({ status: 1 });
exports.BookingSchema.index({ user: 1 });
exports.BookingSchema.index({ provider: 1 });
exports.BookingSchema.index({ scheduledDate: 1 });
exports.BookingSchema.index({ location: '2dsphere' });
//# sourceMappingURL=booking.schema.js.map