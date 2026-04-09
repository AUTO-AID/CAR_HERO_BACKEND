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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateOrderStatusUseCase = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const cache_manager_1 = require("@nestjs/cache-manager");
const order_repository_interface_1 = require("../../domain/repositories/order.repository.interface");
const status_enum_1 = require("../../../../common/enums/status.enum");
const order_events_1 = require("../../domain/events/order.events");
const transfer_earnings_use_case_1 = require("../../../../modules/wallet/application/use-cases/transfer-earnings.use-case");
let UpdateOrderStatusUseCase = class UpdateOrderStatusUseCase {
    orderRepository;
    eventEmitter;
    cacheManager;
    transferEarnings;
    constructor(orderRepository, eventEmitter, cacheManager, transferEarnings) {
        this.orderRepository = orderRepository;
        this.eventEmitter = eventEmitter;
        this.cacheManager = cacheManager;
        this.transferEarnings = transferEarnings;
    }
    async execute(id, status, currentUser) {
        const order = await this.orderRepository.findById(id);
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        const isProvider = order.providerId?.toString() === currentUser._id?.toString();
        const isAdmin = currentUser.role === 'admin';
        if (!isProvider && !isAdmin) {
            throw new common_1.ForbiddenException('You do not have permission to update status for this order');
        }
        if (order.status === status_enum_1.OrderStatus.CANCELLED) {
            throw new common_1.BadRequestException('Cannot update status of a cancelled order');
        }
        const oldStatus = order.status;
        const updateData = { status };
        if (status === status_enum_1.OrderStatus.COMPLETED)
            updateData.completedAt = new Date();
        if (status === status_enum_1.OrderStatus.CANCELLED)
            updateData.cancelledAt = new Date();
        if (status === status_enum_1.OrderStatus.IN_PROGRESS)
            updateData.startedAt = new Date();
        const updatedOrder = await this.orderRepository.update(id, updateData);
        if (status === status_enum_1.OrderStatus.COMPLETED && updatedOrder.providerId && updatedOrder.total > 0) {
            await this.transferEarnings.execute(updatedOrder.providerId, updatedOrder.total, updatedOrder.id, 'order');
        }
        await this.cacheManager.del(`order_${id}`);
        this.eventEmitter.emit(order_events_1.OrderEvents.STATUS_CHANGED, new order_events_1.OrderStatusChangedEvent(id, oldStatus, status, order.orderNumber, order.userId, order.providerId));
        return updatedOrder;
    }
};
exports.UpdateOrderStatusUseCase = UpdateOrderStatusUseCase;
exports.UpdateOrderStatusUseCase = UpdateOrderStatusUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(order_repository_interface_1.IOrderRepository)),
    __param(2, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object, event_emitter_1.EventEmitter2, Object, transfer_earnings_use_case_1.TransferEarningsUseCase])
], UpdateOrderStatusUseCase);
//# sourceMappingURL=update-order-status.use-case.js.map