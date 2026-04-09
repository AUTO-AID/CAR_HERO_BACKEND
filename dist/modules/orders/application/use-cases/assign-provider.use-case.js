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
exports.AssignProviderUseCase = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const order_repository_interface_1 = require("../../domain/repositories/order.repository.interface");
const status_enum_1 = require("../../../../common/enums/status.enum");
const order_events_1 = require("../../domain/events/order.events");
let AssignProviderUseCase = class AssignProviderUseCase {
    orderRepository;
    eventEmitter;
    constructor(orderRepository, eventEmitter) {
        this.orderRepository = orderRepository;
        this.eventEmitter = eventEmitter;
    }
    async execute(id, providerId) {
        const order = await this.orderRepository.findById(id);
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        const oldStatus = order.status;
        const updateData = {
            provider: providerId,
            status: status_enum_1.OrderStatus.ACCEPTED,
            acceptedAt: new Date(),
        };
        const updatedOrder = await this.orderRepository.update(id, updateData);
        this.eventEmitter.emit(order_events_1.OrderEvents.STATUS_CHANGED, new order_events_1.OrderStatusChangedEvent(id, oldStatus, status_enum_1.OrderStatus.ACCEPTED, order.orderNumber, order.userId, providerId));
        this.eventEmitter.emit(order_events_1.OrderEvents.PROVIDER_ASSIGNED, { orderId: id, providerId });
        return updatedOrder;
    }
};
exports.AssignProviderUseCase = AssignProviderUseCase;
exports.AssignProviderUseCase = AssignProviderUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(order_repository_interface_1.IOrderRepository)),
    __metadata("design:paramtypes", [Object, event_emitter_1.EventEmitter2])
], AssignProviderUseCase);
//# sourceMappingURL=assign-provider.use-case.js.map