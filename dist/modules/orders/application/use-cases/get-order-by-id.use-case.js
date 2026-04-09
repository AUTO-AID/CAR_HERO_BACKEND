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
exports.GetOrderByIdUseCase = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const order_repository_interface_1 = require("../../domain/repositories/order.repository.interface");
let GetOrderByIdUseCase = class GetOrderByIdUseCase {
    orderRepository;
    cacheManager;
    constructor(orderRepository, cacheManager) {
        this.orderRepository = orderRepository;
        this.cacheManager = cacheManager;
    }
    async execute(id, currentUser) {
        const cacheKey = `order_${id}`;
        const cachedOrder = await this.cacheManager.get(cacheKey);
        let order;
        if (cachedOrder) {
            order = cachedOrder;
        }
        else {
            order = await this.orderRepository.findById(id);
            if (!order) {
                throw new common_1.NotFoundException('Order not found');
            }
            await this.cacheManager.set(cacheKey, order, 300000);
        }
        const isOwner = order.userId?.toString() === currentUser._id?.toString();
        const isProvider = order.providerId?.toString() === currentUser._id?.toString();
        const isAdmin = currentUser.role === 'admin';
        if (!isOwner && !isProvider && !isAdmin) {
            throw new common_1.ForbiddenException('You do not have permission to view this order');
        }
        return order;
    }
};
exports.GetOrderByIdUseCase = GetOrderByIdUseCase;
exports.GetOrderByIdUseCase = GetOrderByIdUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(order_repository_interface_1.IOrderRepository)),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object, Object])
], GetOrderByIdUseCase);
//# sourceMappingURL=get-order-by-id.use-case.js.map