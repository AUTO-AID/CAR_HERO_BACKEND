"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const auth_controller_1 = require("./presentation/controllers/auth.controller");
const auth_service_1 = require("./application/services/auth.service");
const otp_service_1 = require("./application/services/otp.service");
const jwt_strategy_1 = require("./infrastructure/strategies/jwt.strategy");
const user_schema_1 = require("../users/infrastructure/persistence/mongoose/schemas/user.schema");
const provider_schema_1 = require("../providers/infrastructure/persistence/mongoose/schemas/provider.schema");
const admin_schema_1 = require("../admin/infrastructure/persistence/mongoose/schemas/admin.schema");
const logout_schema_1 = require("./infrastructure/persistence/mongoose/schemas/logout.schema");
const pending_registration_schema_1 = require("./infrastructure/persistence/mongoose/schemas/pending-registration.schema");
const notifications_module_1 = require("../notifications/notifications.module");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: provider_schema_1.Provider.name, schema: provider_schema_1.ProviderSchema },
                { name: admin_schema_1.Admin.name, schema: admin_schema_1.AdminSchema },
                { name: logout_schema_1.Logout.name, schema: logout_schema_1.LogoutSchema },
                { name: pending_registration_schema_1.PendingRegistration.name, schema: pending_registration_schema_1.PendingRegistrationSchema },
            ]),
            notifications_module_1.NotificationsModule,
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    secret: configService.getOrThrow('JWT_SECRET'),
                    signOptions: {
                        expiresIn: (configService.get('JWT_EXPIRES_IN') ??
                            '1d'),
                    },
                }),
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 5,
                },
            ]),
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [auth_service_1.AuthService, otp_service_1.OtpService, jwt_strategy_1.JwtStrategy],
        exports: [auth_service_1.AuthService, jwt_strategy_1.JwtStrategy],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map