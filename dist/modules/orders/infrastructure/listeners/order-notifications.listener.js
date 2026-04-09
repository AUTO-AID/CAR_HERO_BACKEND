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
exports.OrderNotificationsListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const order_events_1 = require("../../domain/events/order.events");
const notifications_service_1 = require("../../../notifications/notifications.service");
const status_enum_1 = require("../../../../common/enums/status.enum");
let OrderNotificationsListener = class OrderNotificationsListener {
    notificationsService;
    constructor(notificationsService) {
        this.notificationsService = notificationsService;
    }
    async handleOrderStatusChanged(event) {
        const { orderId, orderNumber, newStatus, userId, providerId } = event;
        await this.notificationsService.createNotification({
            recipientId: userId,
            recipientType: 'user',
            title: 'Order Updated 🔔',
            body: `Your order ${orderNumber} status changed to ${newStatus}`,
            type: status_enum_1.NotificationType.ORDER_UPDATED,
            data: { orderId, orderNumber, status: newStatus }
        });
        if (providerId) {
            await this.notificationsService.createNotification({
                recipientId: providerId,
                recipientType: 'provider',
                title: 'Order Status Sync 🛠️',
                body: `Order ${orderNumber} is now ${newStatus}`,
                type: status_enum_1.NotificationType.ORDER_UPDATED,
                data: { orderId, orderNumber, status: newStatus }
            });
        }
    }
    async handleProviderAssigned(payload) {
        await this.notificationsService.createNotification({
            recipientId: payload.providerId,
            recipientType: 'provider',
            title: 'New Assignment! 🛠️',
            body: `You have been assigned to order ${payload.orderNumber}`,
            type: status_enum_1.NotificationType.ORDER_CREATED,
            data: { orderId: payload.orderId, orderNumber: payload.orderNumber }
        });
    }
};
exports.OrderNotificationsListener = OrderNotificationsListener;
__decorate([
    (0, event_emitter_1.OnEvent)(order_events_1.OrderEvents.STATUS_CHANGED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [order_events_1.OrderStatusChangedEvent]),
    __metadata("design:returntype", Promise)
], OrderNotificationsListener.prototype, "handleOrderStatusChanged", null);
__decorate([
    (0, event_emitter_1.OnEvent)(order_events_1.OrderEvents.PROVIDER_ASSIGNED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrderNotificationsListener.prototype, "handleProviderAssigned", null);
exports.OrderNotificationsListener = OrderNotificationsListener = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], OrderNotificationsListener);
//# sourceMappingURL=order-notifications.listener.js.map