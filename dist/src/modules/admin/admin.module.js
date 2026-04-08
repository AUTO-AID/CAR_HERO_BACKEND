"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const jwt_1 = require("@nestjs/jwt");
const admin_schema_1 = require("../../database/schemas/admin.schema");
const admin_controller_1 = require("./controllers/admin.controller");
const admin_service_1 = require("./services/admin.service");
const users_module_1 = require("../users/users.module");
const providers_module_1 = require("../providers/providers.module");
const services_module_1 = require("../services/services.module");
const bookings_module_1 = require("../bookings/bookings.module");
const orders_module_1 = require("../orders/orders.module");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: admin_schema_1.Admin.name, schema: admin_schema_1.AdminSchema }]),
            jwt_1.JwtModule,
            users_module_1.UsersModule,
            providers_module_1.ProvidersModule,
            services_module_1.ServicesModule,
            bookings_module_1.BookingsModule,
            orders_module_1.OrdersModule,
        ],
        controllers: [admin_controller_1.AdminController],
        providers: [admin_service_1.AdminService],
        exports: [admin_service_1.AdminService],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map