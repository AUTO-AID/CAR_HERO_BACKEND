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
exports.CreateOrderUseCase = void 0;
const common_1 = require("@nestjs/common");
const order_repository_interface_1 = require("../../domain/repositories/order.repository.interface");
const order_entity_1 = require("../../domain/entities/order.entity");
const status_enum_1 = require("../../../../common/enums/status.enum");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const service_schema_1 = require("../../../../database/schemas/service.schema");
const notifications_service_1 = require("../../../notifications/notifications.service");
const status_enum_2 = require("../../../../common/enums/status.enum");
let CreateOrderUseCase = class CreateOrderUseCase {
    orderRepository;
    serviceModel;
    notificationsService;
    constructor(orderRepository, serviceModel, notificationsService) {
        this.orderRepository = orderRepository;
        this.serviceModel = serviceModel;
        this.notificationsService = notificationsService;
    }
    async execute(dto) {
        const service = await this.serviceModel.findById(dto.serviceId);
        if (!service) {
            throw new common_1.NotFoundException('Service not found');
        }
        const orderData = {
            orderNumber: order_entity_1.OrderEntity.generateOrderNumber(),
            userId: dto.userId,
            serviceId: dto.serviceId,
            providerId: dto.providerId,
            vehicleId: dto.vehicleId,
            status: status_enum_1.OrderStatus.PENDING,
            serviceName: service.name,
            servicePrice: service.basePrice,
            total: service.basePrice,
            userLocation: {
                type: 'Point',
                coordinates: dto.location.coordinates,
            },
            userNotes: dto.notes,
            scheduledAt: dto.scheduleTime ? new Date(dto.scheduleTime) : undefined,
            isScheduled: !!dto.scheduleTime,
        };
        const order = await this.orderRepository.create(orderData);
        if (order.providerId) {
            await this.notificationsService.createNotification({
                recipientId: order.providerId,
                recipientType: 'provider',
                title: 'New Order Received 📦',
                body: `You have a new order: ${order.orderNumber} for ${order.serviceName}`,
                type: status_enum_2.NotificationType.ORDER_CREATED,
                data: { orderId: order.id, orderNumber: order.orderNumber }
            });
        }
        return order;
    }
};
exports.CreateOrderUseCase = CreateOrderUseCase;
exports.CreateOrderUseCase = CreateOrderUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(order_repository_interface_1.IOrderRepository)),
    __param(1, (0, mongoose_1.InjectModel)(service_schema_1.Service.name)),
    __metadata("design:paramtypes", [Object, mongoose_2.Model,
        notifications_service_1.NotificationsService])
], CreateOrderUseCase);
//# sourceMappingURL=create-order.use-case.js.map