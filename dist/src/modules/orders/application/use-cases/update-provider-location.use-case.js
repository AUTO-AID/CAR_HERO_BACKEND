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
exports.UpdateProviderLocationUseCase = void 0;
const common_1 = require("@nestjs/common");
const order_repository_interface_1 = require("../../domain/repositories/order.repository.interface");
const status_enum_1 = require("../../../../core/enums/status.enum");
let UpdateProviderLocationUseCase = class UpdateProviderLocationUseCase {
    orderRepository;
    constructor(orderRepository) {
        this.orderRepository = orderRepository;
    }
    async execute(id, dto, currentUser) {
        const order = await this.orderRepository.findById(id);
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        const isAssignedProvider = order.providerId?.toString() === currentUser._id?.toString();
        const isAdmin = currentUser.role === 'admin';
        if (!isAssignedProvider && !isAdmin) {
            throw new common_1.ForbiddenException('You are not authorized to update location for this order');
        }
        const activeStatuses = [status_enum_1.OrderStatus.ACCEPTED, status_enum_1.OrderStatus.IN_PROGRESS];
        if (!activeStatuses.includes(order.status)) {
            throw new common_1.BadRequestException('Location tracking is only available for active orders');
        }
        return this.orderRepository.updateProviderLocation(id, dto.coordinates);
    }
};
exports.UpdateProviderLocationUseCase = UpdateProviderLocationUseCase;
exports.UpdateProviderLocationUseCase = UpdateProviderLocationUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(order_repository_interface_1.IOrderRepository)),
    __metadata("design:paramtypes", [Object])
], UpdateProviderLocationUseCase);
//# sourceMappingURL=update-provider-location.use-case.js.map