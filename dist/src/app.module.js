"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const throttler_1 = require("@nestjs/throttler");
const event_emitter_1 = require("@nestjs/event-emitter");
const schedule_1 = require("@nestjs/schedule");
const cache_manager_1 = require("@nestjs/cache-manager");
const core_module_1 = require("./core/core.module");
const env_config_1 = __importDefault(require("./config/env.config"));
const mongo_config_1 = require("./config/mongo.config");
const setting_schema_1 = require("./modules/admin/infrastructure/persistence/mongoose/schemas/setting.schema");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const providers_module_1 = require("./modules/providers/providers.module");
const vehicles_module_1 = require("./modules/vehicles/vehicles.module");
const services_module_1 = require("./modules/services/services.module");
const orders_module_1 = require("./modules/orders/orders.module");
const bookings_module_1 = require("./modules/bookings/bookings.module");
const chat_module_1 = require("./modules/chat/chat.module");
const wallet_module_1 = require("./modules/wallet/wallet.module");
const subscriptions_module_1 = require("./modules/subscriptions/subscriptions.module");
const reviews_module_1 = require("./modules/reviews/reviews.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const admin_module_1 = require("./modules/admin/admin.module");
const ai_module_1 = require("./modules/ai/ai.module");
const gateway_module_1 = require("./modules/gateway/gateway.module");
const profile_module_1 = require("./modules/profile/profile.module");
const whatsapp_module_1 = require("./modules/whatsapp/whatsapp.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            core_module_1.CoreModule,
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [env_config_1.default],
                envFilePath: ['.env', '.env.local'],
            }),
            cache_manager_1.CacheModule.register({ isGlobal: true, ttl: 60000 }),
            schedule_1.ScheduleModule.forRoot(),
            event_emitter_1.EventEmitterModule.forRoot(),
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }]),
            mongoose_1.MongooseModule.forRootAsync(mongo_config_1.mongoConfig),
            mongoose_1.MongooseModule.forFeature([{ name: setting_schema_1.Setting.name, schema: setting_schema_1.SettingSchema }]),
            whatsapp_module_1.WhatsAppModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            providers_module_1.ProvidersModule,
            vehicles_module_1.VehiclesModule,
            services_module_1.ServicesModule,
            orders_module_1.OrdersModule,
            bookings_module_1.BookingsModule,
            chat_module_1.ChatModule,
            wallet_module_1.WalletModule,
            subscriptions_module_1.SubscriptionsModule,
            reviews_module_1.ReviewsModule,
            notifications_module_1.NotificationsModule,
            admin_module_1.AdminModule,
            ai_module_1.AiModule,
            gateway_module_1.GatewayModule,
            profile_module_1.ProfileModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map