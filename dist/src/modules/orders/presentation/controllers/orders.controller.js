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
exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const create_order_use_case_1 = require("../../application/use-cases/create-order.use-case");
const get_orders_use_case_1 = require("../../application/use-cases/get-orders.use-case");
const get_order_by_id_use_case_1 = require("../../application/use-cases/get-order-by-id.use-case");
const update_order_status_use_case_1 = require("../../application/use-cases/update-order-status.use-case");
const update_order_use_case_1 = require("../../application/use-cases/update-order.use-case");
const assign_provider_use_case_1 = require("../../application/use-cases/assign-provider.use-case");
const delete_order_use_case_1 = require("../../application/use-cases/delete-order.use-case");
const search_orders_use_case_1 = require("../../application/use-cases/search-orders.use-case");
const get_order_stats_use_case_1 = require("../../application/use-cases/get-order-stats.use-case");
const export_orders_use_case_1 = require("../../application/use-cases/export-orders.use-case");
const notify_order_use_case_1 = require("../../application/use-cases/notify-order.use-case");
const review_order_use_case_1 = require("../../application/use-cases/review-order.use-case");
const update_provider_location_use_case_1 = require("../../application/use-cases/update-provider-location.use-case");
const verify_payment_use_case_1 = require("../../application/use-cases/verify-payment.use-case");
const cancel_order_use_case_1 = require("../../application/use-cases/cancel-order.use-case");
const create_order_dto_1 = require("../../application/dto/create-order.dto");
const review_order_dto_1 = require("../../application/dto/review-order.dto");
const update_location_dto_1 = require("../../application/dto/update-location.dto");
const verify_payment_dto_1 = require("../../application/dto/verify-payment.dto");
const cancel_order_dto_1 = require("../../application/dto/cancel-order.dto");
const jwt_auth_guard_1 = require("../../../../core/guards/jwt-auth.guard");
const status_enum_1 = require("../../../../core/enums/status.enum");
let OrdersController = class OrdersController {
    createOrderUseCase;
    getOrdersUseCase;
    getOrderByIdUseCase;
    updateOrderStatusUseCase;
    updateOrderUseCase;
    assignProviderUseCase;
    deleteOrderUseCase;
    searchOrdersUseCase;
    getOrderStatsUseCase;
    exportOrdersUseCase;
    notifyOrderUseCase;
    reviewOrderUseCase;
    updateProviderLocationUseCase;
    verifyPaymentUseCase;
    cancelOrderUseCase;
    constructor(createOrderUseCase, getOrdersUseCase, getOrderByIdUseCase, updateOrderStatusUseCase, updateOrderUseCase, assignProviderUseCase, deleteOrderUseCase, searchOrdersUseCase, getOrderStatsUseCase, exportOrdersUseCase, notifyOrderUseCase, reviewOrderUseCase, updateProviderLocationUseCase, verifyPaymentUseCase, cancelOrderUseCase) {
        this.createOrderUseCase = createOrderUseCase;
        this.getOrdersUseCase = getOrdersUseCase;
        this.getOrderByIdUseCase = getOrderByIdUseCase;
        this.updateOrderStatusUseCase = updateOrderStatusUseCase;
        this.updateOrderUseCase = updateOrderUseCase;
        this.assignProviderUseCase = assignProviderUseCase;
        this.deleteOrderUseCase = deleteOrderUseCase;
        this.searchOrdersUseCase = searchOrdersUseCase;
        this.getOrderStatsUseCase = getOrderStatsUseCase;
        this.exportOrdersUseCase = exportOrdersUseCase;
        this.notifyOrderUseCase = notifyOrderUseCase;
        this.reviewOrderUseCase = reviewOrderUseCase;
        this.updateProviderLocationUseCase = updateProviderLocationUseCase;
        this.verifyPaymentUseCase = verifyPaymentUseCase;
        this.cancelOrderUseCase = cancelOrderUseCase;
    }
    async createOrder(createOrderDto, req) {
        createOrderDto.userId = req.user._id;
        return this.createOrderUseCase.execute(createOrderDto);
    }
    async getAllOrders(page, limit, status, req) {
        const criteria = status ? { status } : {};
        if (req.user.role !== 'admin') {
            if (req.user.role === 'provider')
                criteria.provider = req.user._id;
            else
                criteria.user = req.user._id;
        }
        return this.getOrdersUseCase.execute(criteria, Number(page) || 1, Number(limit) || 10);
    }
    async searchOrders(query) {
        return this.searchOrdersUseCase.execute(query);
    }
    async exportReport(from, to, status) {
        return this.exportOrdersUseCase.execute(from, to, status);
    }
    async getStats(period = 'week') {
        return this.getOrderStatsUseCase.execute(period);
    }
    async getOrderById(id, req) {
        return this.getOrderByIdUseCase.execute(id, req.user);
    }
    async updateStatus(id, status, req) {
        return this.updateOrderStatusUseCase.execute(id, status, req.user);
    }
    async updateOrder(id, dto, req) {
        return this.updateOrderUseCase.execute(id, dto);
    }
    async updateLocation(id, locationDto, req) {
        return this.updateProviderLocationUseCase.execute(id, locationDto, req.user);
    }
    async verifyPayment(id, verifyPaymentDto, req) {
        return this.verifyPaymentUseCase.execute(id, verifyPaymentDto);
    }
    async cancelOrder(id, cancelOrderDto, req) {
        return this.cancelOrderUseCase.execute(id, cancelOrderDto, req.user);
    }
    async reviewOrder(id, reviewDto, req) {
        return this.reviewOrderUseCase.execute(id, reviewDto, req.user);
    }
    async deleteOrder(id) {
        return this.deleteOrderUseCase.execute(id);
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, common_1.Post)('orders'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new service order' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_order_dto_1.CreateOrderDto, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Get)('orders'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all orders (Paginated)' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: status_enum_1.OrderStatus }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getAllOrders", null);
__decorate([
    (0, common_1.Get)('orders/search'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Search orders by various fields' }),
    (0, swagger_1.ApiQuery)({ name: 'query', required: true, type: String }),
    __param(0, (0, common_1.Query)('query')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "searchOrders", null);
__decorate([
    (0, common_1.Get)('orders/report'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Export orders report' }),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "exportReport", null);
__decorate([
    (0, common_1.Get)('orders/stats'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Get order statistics' }),
    __param(0, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('orders/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Get order details by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getOrderById", null);
__decorate([
    (0, common_1.Patch)('orders/:id/status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Update order status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)('orders/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Update order details' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "updateOrder", null);
__decorate([
    (0, common_1.Patch)('orders/:id/location'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Update provider live location' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_location_dto_1.UpdateLocationDto, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "updateLocation", null);
__decorate([
    (0, common_1.Post)('orders/:id/payment/verify'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify and confirm payment for an order' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, verify_payment_dto_1.VerifyPaymentDto, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "verifyPayment", null);
__decorate([
    (0, common_1.Post)('orders/:id/cancel'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel an order with a reason' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, cancel_order_dto_1.CancelOrderDto, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "cancelOrder", null);
__decorate([
    (0, common_1.Post)('orders/:id/review'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Review and rate an order' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, review_order_dto_1.ReviewOrderDto, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "reviewOrder", null);
__decorate([
    (0, common_1.Delete)('orders/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an order permanently' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "deleteOrder", null);
exports.OrdersController = OrdersController = __decorate([
    (0, swagger_1.ApiTags)('Orders'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [create_order_use_case_1.CreateOrderUseCase,
        get_orders_use_case_1.GetOrdersUseCase,
        get_order_by_id_use_case_1.GetOrderByIdUseCase,
        update_order_status_use_case_1.UpdateOrderStatusUseCase,
        update_order_use_case_1.UpdateOrderUseCase,
        assign_provider_use_case_1.AssignProviderUseCase,
        delete_order_use_case_1.DeleteOrderUseCase,
        search_orders_use_case_1.SearchOrdersUseCase,
        get_order_stats_use_case_1.GetOrderStatsUseCase,
        export_orders_use_case_1.ExportOrdersUseCase,
        notify_order_use_case_1.NotifyOrderUseCase,
        review_order_use_case_1.ReviewOrderUseCase,
        update_provider_location_use_case_1.UpdateProviderLocationUseCase,
        verify_payment_use_case_1.VerifyPaymentUseCase,
        cancel_order_use_case_1.CancelOrderUseCase])
], OrdersController);
//# sourceMappingURL=orders.controller.js.map