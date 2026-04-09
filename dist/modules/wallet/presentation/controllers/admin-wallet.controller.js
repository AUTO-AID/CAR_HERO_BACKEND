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
exports.AdminWalletController = void 0;
const common_1 = require("@nestjs/common");
const get_balance_use_case_1 = require("../../application/use-cases/get-balance.use-case");
const transaction_history_use_case_1 = require("../../application/use-cases/transaction-history.use-case");
const jwt_auth_guard_1 = require("../../../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../../common/guards/roles.guard");
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
const roles_enum_1 = require("../../../../common/enums/roles.enum");
let AdminWalletController = class AdminWalletController {
    getBalance;
    historyUseCase;
    constructor(getBalance, historyUseCase) {
        this.getBalance = getBalance;
        this.historyUseCase = historyUseCase;
        this.SYSTEM_OWNER_ID = 'platform_earnings';
    }
    SYSTEM_OWNER_ID;
    async getPlatformWallet() {
        const wallet = await this.getBalance.execute(this.SYSTEM_OWNER_ID, 'system');
        return { success: true, data: wallet };
    }
    async getPlatformTransactions(page, limit) {
        const result = await this.historyUseCase.execute(this.SYSTEM_OWNER_ID, 'system', page || 1, limit || 10);
        return { success: true, ...result };
    }
    async getWallet(ownerId, type) {
        const wallet = await this.getBalance.execute(ownerId, type || 'user');
        return { success: true, data: wallet };
    }
    async getTransactions(ownerId, type, page, limit) {
        const result = await this.historyUseCase.execute(ownerId, type || 'user', page || 1, limit || 10);
        return { success: true, ...result };
    }
    async adjustBalance(ownerId, dto) {
        return { success: true, message: 'Balance adjusted successfully (Skeleton)' };
    }
};
exports.AdminWalletController = AdminWalletController;
__decorate([
    (0, common_1.Get)('platform'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminWalletController.prototype, "getPlatformWallet", null);
__decorate([
    (0, common_1.Get)('platform/transactions'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AdminWalletController.prototype, "getPlatformTransactions", null);
__decorate([
    (0, common_1.Get)(':ownerId'),
    __param(0, (0, common_1.Param)('ownerId')),
    __param(1, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminWalletController.prototype, "getWallet", null);
__decorate([
    (0, common_1.Get)(':ownerId/transactions'),
    __param(0, (0, common_1.Param)('ownerId')),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], AdminWalletController.prototype, "getTransactions", null);
__decorate([
    (0, common_1.Post)(':ownerId/adjust'),
    __param(0, (0, common_1.Param)('ownerId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminWalletController.prototype, "adjustBalance", null);
exports.AdminWalletController = AdminWalletController = __decorate([
    (0, common_1.Controller)('v1/admin/wallet'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.ADMIN),
    __metadata("design:paramtypes", [get_balance_use_case_1.GetBalanceUseCase,
        transaction_history_use_case_1.TransactionHistoryUseCase])
], AdminWalletController);
//# sourceMappingURL=admin-wallet.controller.js.map