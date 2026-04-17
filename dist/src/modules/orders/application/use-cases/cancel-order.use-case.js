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
exports.CancelOrderUseCase = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const cache_manager_1 = require("@nestjs/cache-manager");
const order_repository_interface_1 = require("../../domain/repositories/order.repository.interface");
const status_enum_1 = require("../../../../core/enums/status.enum");
const order_events_1 = require("../../domain/events/order.events");
const transaction_entity_1 = require("../../../../modules/wallet/domain/entities/transaction.entity");
const status_enum_2 = require("../../../../core/enums/status.enum");
let CancelOrderUseCase = class CancelOrderUseCase {
    orderRepository;
    eventEmitter;
    cacheManager;
    walletRepository;
    constructor(orderRepository, eventEmitter, cacheManager, walletRepository) {
        this.orderRepository = orderRepository;
        this.eventEmitter = eventEmitter;
        this.cacheManager = cacheManager;
        this.walletRepository = walletRepository;
    }
    async execute(id, dto, currentUser) {
        const order = await this.orderRepository.findById(id);
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        const isOwner = order.userId?.toString() === currentUser._id?.toString();
        const isProvider = order.providerId?.toString() === currentUser._id?.toString();
        const isAdmin = currentUser.role === 'admin';
        if (!isOwner && !isProvider && !isAdmin) {
            throw new common_1.ForbiddenException('You do not have permission to cancel this order');
        }
        const nonCancellableStatuses = [status_enum_1.OrderStatus.COMPLETED, status_enum_1.OrderStatus.CANCELLED];
        if (nonCancellableStatuses.includes(order.status)) {
            throw new common_1.BadRequestException(`Cannot cancel an order that is already ${order.status}`);
        }
        if (order.status === status_enum_1.OrderStatus.IN_PROGRESS) {
            throw new common_1.BadRequestException('Cannot cancel an order that is already in progress');
        }
        const oldStatus = order.status;
        const cancelledOrder = await this.orderRepository.cancelOrder(id, dto.reason, dto.cancelledBy);
        if (order.paymentStatus === status_enum_2.PaymentStatus.COMPLETED && order.total > 0 && order.userId) {
            await this.walletRepository.executeTransaction(order.userId, 'user', async (wallet, session) => {
                const balanceBefore = wallet.balance;
                wallet.deposit(order.total);
                const balanceAfter = wallet.balance;
                const transaction = new transaction_entity_1.Transaction(transaction_entity_1.Transaction.generateTransactionNumber(), wallet.id, wallet.ownerId, wallet.ownerType, status_enum_2.TransactionType.REFUND, order.total, balanceBefore, balanceAfter, `Refund for cancelled order #${order.orderNumber}`, undefined, 'order', order.id, undefined, undefined, 'completed');
                return { wallet, transaction };
            });
            await this.orderRepository.update(id, { paymentStatus: status_enum_2.PaymentStatus.REFUNDED });
        }
        await this.cacheManager.del(`order_${id}`);
        this.eventEmitter.emit(order_events_1.OrderEvents.STATUS_CHANGED, new order_events_1.OrderStatusChangedEvent(id, oldStatus, status_enum_1.OrderStatus.CANCELLED, order.orderNumber, order.userId, order.providerId));
        this.eventEmitter.emit(order_events_1.OrderEvents.CANCELLED, { orderId: id, reason: dto.reason });
        return cancelledOrder;
    }
};
exports.CancelOrderUseCase = CancelOrderUseCase;
exports.CancelOrderUseCase = CancelOrderUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(order_repository_interface_1.IOrderRepository)),
    __param(2, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __param(3, (0, common_1.Inject)('IWalletRepository')),
    __metadata("design:paramtypes", [Object, event_emitter_1.EventEmitter2, Object, Object])
], CancelOrderUseCase);
//# sourceMappingURL=cancel-order.use-case.js.map