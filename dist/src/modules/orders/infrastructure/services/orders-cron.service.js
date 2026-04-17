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
var OrdersCronService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersCronService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const order_repository_interface_1 = require("../../domain/repositories/order.repository.interface");
const cancel_order_use_case_1 = require("../../application/use-cases/cancel-order.use-case");
let OrdersCronService = OrdersCronService_1 = class OrdersCronService {
    orderRepository;
    cancelOrderUseCase;
    logger = new common_1.Logger(OrdersCronService_1.name);
    constructor(orderRepository, cancelOrderUseCase) {
        this.orderRepository = orderRepository;
        this.cancelOrderUseCase = cancelOrderUseCase;
    }
    async handleExpiredOrders() {
        this.logger.debug('Running Cron: Checking for expired pending orders...');
        const expiredOrders = await this.orderRepository.findExpiredPendingOrders(2);
        if (expiredOrders.length === 0) {
            this.logger.debug('No expired orders found.');
            return;
        }
        this.logger.warn(`Found ${expiredOrders.length} expired orders. Proceeding to cancel...`);
        for (const order of expiredOrders) {
            try {
                await this.cancelOrderUseCase.execute(order.id, {
                    reason: 'Auto-cancelled due to inactivity (2+ hours pending)'
                });
                this.logger.log(`Order ${order.orderNumber} auto-cancelled successfully.`);
            }
            catch (error) {
                this.logger.error(`Failed to auto-cancel order ${order.orderNumber}: ${error.message}`);
            }
        }
    }
};
exports.OrdersCronService = OrdersCronService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_10_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OrdersCronService.prototype, "handleExpiredOrders", null);
exports.OrdersCronService = OrdersCronService = OrdersCronService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(order_repository_interface_1.IOrderRepository)),
    __metadata("design:paramtypes", [Object, cancel_order_use_case_1.CancelOrderUseCase])
], OrdersCronService);
//# sourceMappingURL=orders-cron.service.js.map