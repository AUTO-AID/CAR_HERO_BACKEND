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
let Booking = class Booking {
    bookingNumber;
    user;
    provider;
    service;
    vehicle;
    status;
    scheduledDate;
    totalPrice;
    location;
    address;
    paymentStatus;
    paymentMethod;
    userNotes;
    review;
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
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Provider' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Booking.prototype, "provider", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Service', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Booking.prototype, "service", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Vehicle', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Booking.prototype, "vehicle", void 0);
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
    __metadata("design:type", Number)
], Booking.prototype, "totalPrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: GeoLocation, required: true }),
    __metadata("design:type", GeoLocation)
], Booking.prototype, "location", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Booking.prototype, "address", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: status_enum_1.PaymentStatus, default: status_enum_1.PaymentStatus.PENDING }),
    __metadata("design:type", String)
], Booking.prototype, "paymentStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Booking.prototype, "paymentMethod", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Booking.prototype, "userNotes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Review' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Booking.prototype, "review", void 0);
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
exports.BookingSchema.index({ user: 1 });
exports.BookingSchema.index({ provider: 1 });
exports.BookingSchema.index({ scheduledDate: 1 });
exports.BookingSchema.index({ status: 1 });
exports.BookingSchema.index({ location: '2dsphere' });
//# sourceMappingURL=booking.schema.js.map