"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const order_schema_1 = require("./infrastructure/persistence/mongoose/schemas/order.schema");
const service_schema_1 = require("../services/infrastructure/persistence/mongoose/schemas/service.schema");
const order_repository_interface_1 = require("./domain/repositories/order.repository.interface");
const mongoose_order_repository_1 = require("./infrastructure/persistence/mongoose-order.repository");
const create_order_use_case_1 = require("./application/use-cases/create-order.use-case");
const get_orders_use_case_1 = require("./application/use-cases/get-orders.use-case");
const get_order_by_id_use_case_1 = require("./application/use-cases/get-order-by-id.use-case");
const update_order_status_use_case_1 = require("./application/use-cases/update-order-status.use-case");
const update_order_use_case_1 = require("./application/use-cases/update-order.use-case");
const assign_provider_use_case_1 = require("./application/use-cases/assign-provider.use-case");
const delete_order_use_case_1 = require("./application/use-cases/delete-order.use-case");
const search_orders_use_case_1 = require("./application/use-cases/search-orders.use-case");
const get_order_stats_use_case_1 = require("./application/use-cases/get-order-stats.use-case");
const export_orders_use_case_1 = require("./application/use-cases/export-orders.use-case");
const notify_order_use_case_1 = require("./application/use-cases/notify-order.use-case");
const review_order_use_case_1 = require("./application/use-cases/review-order.use-case");
const update_provider_location_use_case_1 = require("./application/use-cases/update-provider-location.use-case");
const verify_payment_use_case_1 = require("./application/use-cases/verify-payment.use-case");
const cancel_order_use_case_1 = require("./application/use-cases/cancel-order.use-case");
const order_notifications_listener_1 = require("./infrastructure/listeners/order-notifications.listener");
const orders_cron_service_1 = require("./infrastructure/services/orders-cron.service");
const orders_controller_1 = require("./presentation/controllers/orders.controller");
const wallet_module_1 = require("../wallet/wallet.module");
const notifications_module_1 = require("../notifications/notifications.module");
const reviews_module_1 = require("../reviews/reviews.module");
let OrdersModule = class OrdersModule {
};
exports.OrdersModule = OrdersModule;
exports.OrdersModule = OrdersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: order_schema_1.Order.name, schema: order_schema_1.OrderSchema },
                { name: service_schema_1.Service.name, schema: service_schema_1.ServiceSchema },
            ]),
            wallet_module_1.WalletModule,
            notifications_module_1.NotificationsModule,
            (0, common_1.forwardRef)(() => reviews_module_1.ReviewsModule),
        ],
        controllers: [orders_controller_1.OrdersController],
        providers: [
            create_order_use_case_1.CreateOrderUseCase,
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
            cancel_order_use_case_1.CancelOrderUseCase,
            order_notifications_listener_1.OrderNotificationsListener,
            orders_cron_service_1.OrdersCronService,
            {
                provide: order_repository_interface_1.IOrderRepository,
                useClass: mongoose_order_repository_1.MongooseOrderRepository,
            },
        ],
        exports: [order_repository_interface_1.IOrderRepository],
    })
], OrdersModule);
//# sourceMappingURL=orders.module.js.map