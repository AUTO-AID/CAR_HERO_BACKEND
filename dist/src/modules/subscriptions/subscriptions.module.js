"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const subscriptions_controller_1 = require("./presentation/controllers/subscriptions.controller");
const subscription_plan_schema_1 = require("./infrastructure/persistence/mongoose/schemas/subscription-plan.schema");
const user_subscription_schema_1 = require("./infrastructure/persistence/mongoose/schemas/user-subscription.schema");
const subscription_repository_interface_1 = require("./domain/repositories/subscription.repository.interface");
const mongoose_subscription_repository_1 = require("./infrastructure/repositories/mongoose-subscription.repository");
const get_subscription_plans_use_case_1 = require("./application/use-cases/get-subscription-plans.use-case");
const subscribe_user_use_case_1 = require("./application/use-cases/subscribe-user.use-case");
const check_subscription_status_use_case_1 = require("./application/use-cases/check-subscription-status.use-case");
const subscription_plan_seeder_1 = require("./infrastructure/persistence/mongoose/seeders/subscription-plan.seeder");
const UseCases = [
    get_subscription_plans_use_case_1.GetSubscriptionPlansUseCase,
    subscribe_user_use_case_1.SubscribeUserUseCase,
    check_subscription_status_use_case_1.CheckSubscriptionStatusUseCase,
];
let SubscriptionsModule = class SubscriptionsModule {
};
exports.SubscriptionsModule = SubscriptionsModule;
exports.SubscriptionsModule = SubscriptionsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: subscription_plan_schema_1.SubscriptionPlan.name, schema: subscription_plan_schema_1.SubscriptionPlanSchema },
                { name: user_subscription_schema_1.UserSubscription.name, schema: user_subscription_schema_1.UserSubscriptionSchema },
            ]),
        ],
        controllers: [subscriptions_controller_1.SubscriptionsController],
        providers: [
            {
                provide: subscription_repository_interface_1.ISubscriptionRepository,
                useClass: mongoose_subscription_repository_1.MongooseSubscriptionRepository,
            },
            subscription_plan_seeder_1.SubscriptionSeederService,
            ...UseCases,
        ],
        exports: [
            subscription_repository_interface_1.ISubscriptionRepository,
            ...UseCases,
            mongoose_1.MongooseModule,
        ],
    })
], SubscriptionsModule);
//# sourceMappingURL=subscriptions.module.js.map