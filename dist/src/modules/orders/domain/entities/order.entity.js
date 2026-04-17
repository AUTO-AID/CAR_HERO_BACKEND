"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderEntity = void 0;
const status_enum_1 = require("../../../../core/enums/status.enum");
class OrderEntity {
    id;
    orderNumber;
    userId;
    serviceId;
    status;
    total;
    userLocation;
    providerId;
    vehicleId;
    serviceName;
    servicePrice;
    scheduledAt;
    isScheduled;
    paymentStatus;
    paymentMethod;
    userNotes;
    createdAt;
    updatedAt;
    constructor(id, orderNumber, userId, serviceId, status, total, userLocation, providerId, vehicleId, serviceName, servicePrice, scheduledAt, isScheduled, paymentStatus, paymentMethod, userNotes, createdAt, updatedAt) {
        this.id = id;
        this.orderNumber = orderNumber;
        this.userId = userId;
        this.serviceId = serviceId;
        this.status = status;
        this.total = total;
        this.userLocation = userLocation;
        this.providerId = providerId;
        this.vehicleId = vehicleId;
        this.serviceName = serviceName;
        this.servicePrice = servicePrice;
        this.scheduledAt = scheduledAt;
        this.isScheduled = isScheduled;
        this.paymentStatus = paymentStatus;
        this.paymentMethod = paymentMethod;
        this.userNotes = userNotes;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    static generateOrderNumber() {
        return `CH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
    canBeCancelled() {
        return [status_enum_1.OrderStatus.PENDING, status_enum_1.OrderStatus.ACCEPTED].includes(this.status);
    }
}
exports.OrderEntity = OrderEntity;
//# sourceMappingURL=order.entity.js.map