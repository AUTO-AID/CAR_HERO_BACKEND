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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderSchema = exports.Order = void 0;
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
let Order = class Order {
    orderNumber;
    user;
    provider;
    service;
    vehicle;
    status;
    totalAmount;
    discountAmount;
    payableAmount;
    location;
    address;
    isScheduled;
    scheduledAt;
    paymentStatus;
    paymentMethod;
    paymentId;
    userNotes;
    providerNotes;
    images;
    acceptedAt;
    startedAt;
    completedAt;
    cancelledAt;
    cancellationReason;
    cancelledBy;
    review;
    rating;
    metadata;
};
exports.Order = Order;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Order.prototype, "orderNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Order.prototype, "user", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Provider' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Order.prototype, "provider", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Service', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Order.prototype, "service", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Vehicle' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Order.prototype, "vehicle", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: status_enum_1.OrderStatus, default: status_enum_1.OrderStatus.PENDING }),
    __metadata("design:type", String)
], Order.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Order.prototype, "totalAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Order.prototype, "discountAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Order.prototype, "payableAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: GeoLocation, required: true }),
    __metadata("design:type", GeoLocation)
], Order.prototype, "location", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Order.prototype, "address", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Order.prototype, "isScheduled", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Order.prototype, "scheduledAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: status_enum_1.PaymentStatus, default: status_enum_1.PaymentStatus.PENDING }),
    __metadata("design:type", String)
], Order.prototype, "paymentStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: status_enum_1.PaymentMethod, default: status_enum_1.PaymentMethod.CASH }),
    __metadata("design:type", typeof (_a = typeof status_enum_1.PaymentMethod !== "undefined" && status_enum_1.PaymentMethod) === "function" ? _a : Object)
], Order.prototype, "paymentMethod", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Order.prototype, "paymentId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Order.prototype, "userNotes", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Order.prototype, "providerNotes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Order.prototype, "images", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Order.prototype, "acceptedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Order.prototype, "startedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Order.prototype, "completedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Order.prototype, "cancelledAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Order.prototype, "cancellationReason", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: ['user', 'provider', 'admin', 'system'] }),
    __metadata("design:type", String)
], Order.prototype, "cancelledBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Review' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Order.prototype, "review", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Order.prototype, "rating", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], Order.prototype, "metadata", void 0);
exports.Order = Order = __decorate([
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
], Order);
exports.OrderSchema = mongoose_1.SchemaFactory.createForClass(Order);
exports.OrderSchema.index({ orderNumber: 1 }, { unique: true });
exports.OrderSchema.index({ user: 1 });
exports.OrderSchema.index({ provider: 1 });
exports.OrderSchema.index({ status: 1 });
exports.OrderSchema.index({ location: '2dsphere' });
exports.OrderSchema.index({ createdAt: -1 });
//# sourceMappingURL=order.schema.js.map