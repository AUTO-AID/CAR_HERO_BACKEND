"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderStatusChangedEvent = exports.OrderEvents = void 0;
var OrderEvents;
(function (OrderEvents) {
    OrderEvents["CREATED"] = "order.created";
    OrderEvents["STATUS_CHANGED"] = "order.status_changed";
    OrderEvents["PROVIDER_ASSIGNED"] = "order.provider_assigned";
    OrderEvents["CANCELLED"] = "order.cancelled";
    OrderEvents["PAID"] = "order.paid";
})(OrderEvents || (exports.OrderEvents = OrderEvents = {}));
class OrderStatusChangedEvent {
    orderId;
    oldStatus;
    newStatus;
    orderNumber;
    userId;
    providerId;
    constructor(orderId, oldStatus, newStatus, orderNumber, userId, providerId) {
        this.orderId = orderId;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
        this.orderNumber = orderNumber;
        this.userId = userId;
        this.providerId = providerId;
    }
}
exports.OrderStatusChangedEvent = OrderStatusChangedEvent;
//# sourceMappingURL=order.events.js.map