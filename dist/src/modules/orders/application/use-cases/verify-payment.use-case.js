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
exports.VerifyPaymentUseCase = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const order_repository_interface_1 = require("../../domain/repositories/order.repository.interface");
const status_enum_1 = require("../../../../core/enums/status.enum");
const transaction_entity_1 = require("../../../../modules/wallet/domain/entities/transaction.entity");
const status_enum_2 = require("../../../../core/enums/status.enum");
let VerifyPaymentUseCase = class VerifyPaymentUseCase {
    orderRepository;
    cacheManager;
    walletRepository;
    constructor(orderRepository, cacheManager, walletRepository) {
        this.orderRepository = orderRepository;
        this.cacheManager = cacheManager;
        this.walletRepository = walletRepository;
    }
    async execute(id, dto) {
        const order = await this.orderRepository.findById(id);
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (order.paymentStatus === status_enum_1.PaymentStatus.COMPLETED) {
            throw new common_1.BadRequestException('Order is already paid');
        }
        const updatedOrder = await this.orderRepository.updatePaymentDetails(id, dto.paymentId, dto.paymentMethod);
        if (updatedOrder.total > 0 && updatedOrder.userId) {
            await this.walletRepository.executeTransaction('platform_earnings', 'system', async (platformWallet, session) => {
                const balanceBefore = platformWallet.balance;
                platformWallet.deposit(updatedOrder.total);
                const balanceAfter = platformWallet.balance;
                const transaction = new transaction_entity_1.Transaction(transaction_entity_1.Transaction.generateTransactionNumber(), platformWallet.id, platformWallet.ownerId, platformWallet.ownerType, status_enum_2.TransactionType.CREDIT, updatedOrder.total, balanceBefore, balanceAfter, `Payment for order #${updatedOrder.orderNumber}`, undefined, 'order', updatedOrder.id, dto.paymentMethod, dto.paymentId, 'completed');
                return { wallet: platformWallet, transaction };
            });
        }
        await this.cacheManager.del(`order_${id}`);
        return updatedOrder;
    }
};
exports.VerifyPaymentUseCase = VerifyPaymentUseCase;
exports.VerifyPaymentUseCase = VerifyPaymentUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(order_repository_interface_1.IOrderRepository)),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __param(2, (0, common_1.Inject)('IWalletRepository')),
    __metadata("design:paramtypes", [Object, Object, Object])
], VerifyPaymentUseCase);
//# sourceMappingURL=verify-payment.use-case.js.map