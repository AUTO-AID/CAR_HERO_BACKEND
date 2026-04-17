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
exports.SubscribeUserUseCase = void 0;
const common_1 = require("@nestjs/common");
const subscription_repository_interface_1 = require("../../domain/repositories/subscription.repository.interface");
let SubscribeUserUseCase = class SubscribeUserUseCase {
    subscriptionRepository;
    constructor(subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }
    async execute(dto) {
        const plan = await this.subscriptionRepository.findPlanById(dto.planId);
        if (!plan || !plan.isActive) {
            throw new common_1.BadRequestException('Invalid or inactive subscription plan');
        }
        const currentSub = await this.subscriptionRepository.findUserActiveSubscription(dto.userId);
        if (currentSub) {
            throw new common_1.BadRequestException('User already has an active subscription');
        }
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + plan.durationDays);
        return this.subscriptionRepository.createUserSubscription({
            user: dto.userId,
            plan: plan.id,
            startDate,
            endDate,
            status: 'active',
            amountPaid: plan.price,
            autoRenew: true,
        });
    }
};
exports.SubscribeUserUseCase = SubscribeUserUseCase;
exports.SubscribeUserUseCase = SubscribeUserUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(subscription_repository_interface_1.ISubscriptionRepository)),
    __metadata("design:paramtypes", [Object])
], SubscribeUserUseCase);
//# sourceMappingURL=subscribe-user.use-case.js.map