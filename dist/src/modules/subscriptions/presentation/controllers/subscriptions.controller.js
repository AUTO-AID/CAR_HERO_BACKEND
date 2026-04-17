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
exports.SubscriptionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const get_subscription_plans_use_case_1 = require("../../application/use-cases/get-subscription-plans.use-case");
const subscribe_user_use_case_1 = require("../../application/use-cases/subscribe-user.use-case");
const check_subscription_status_use_case_1 = require("../../application/use-cases/check-subscription-status.use-case");
const jwt_auth_guard_1 = require("../../../../core/guards/jwt-auth.guard");
const public_decorator_1 = require("../../../../core/decorators/public.decorator");
let SubscriptionsController = class SubscriptionsController {
    getPlansUseCase;
    subscribeUseCase;
    checkStatusUseCase;
    constructor(getPlansUseCase, subscribeUseCase, checkStatusUseCase) {
        this.getPlansUseCase = getPlansUseCase;
        this.subscribeUseCase = subscribeUseCase;
        this.checkStatusUseCase = checkStatusUseCase;
    }
    async getPlans() {
        return this.getPlansUseCase.execute();
    }
    async subscribe(req, planId) {
        return this.subscribeUseCase.execute({
            userId: req.user.id,
            planId,
        });
    }
    async checkStatus(req) {
        return this.checkStatusUseCase.execute(req.user.id);
    }
    async getHistory(req) {
        return { history: [] };
    }
};
exports.SubscriptionsController = SubscriptionsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('plans'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all available subscription plans' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of subscription plans' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "getPlans", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('subscribe'),
    (0, swagger_1.ApiOperation)({ summary: 'Subscribe the current user to a plan' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('planId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "subscribe", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({ summary: 'Check current user subscription status' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "checkStatus", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user subscription history' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "getHistory", null);
exports.SubscriptionsController = SubscriptionsController = __decorate([
    (0, swagger_1.ApiTags)('Subscriptions'),
    (0, common_1.Controller)('subscriptions'),
    __metadata("design:paramtypes", [get_subscription_plans_use_case_1.GetSubscriptionPlansUseCase,
        subscribe_user_use_case_1.SubscribeUserUseCase,
        check_subscription_status_use_case_1.CheckSubscriptionStatusUseCase])
], SubscriptionsController);
//# sourceMappingURL=subscriptions.controller.js.map