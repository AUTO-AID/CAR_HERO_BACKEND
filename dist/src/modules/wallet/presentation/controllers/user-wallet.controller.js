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
exports.UserWalletController = void 0;
const common_1 = require("@nestjs/common");
const get_balance_use_case_1 = require("../../application/use-cases/get-balance.use-case");
const deposit_use_case_1 = require("../../application/use-cases/deposit.use-case");
const transaction_history_use_case_1 = require("../../application/use-cases/transaction-history.use-case");
const jwt_auth_guard_1 = require("../../../../core/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../../core/guards/roles.guard");
const roles_decorator_1 = require("../../../../core/decorators/roles.decorator");
const roles_enum_1 = require("../../../../core/enums/roles.enum");
const current_user_decorator_1 = require("../../../../core/decorators/current-user.decorator");
const wallet_dto_1 = require("../../application/dto/wallet.dto");
let UserWalletController = class UserWalletController {
    getBalance;
    depositUseCase;
    historyUseCase;
    constructor(getBalance, depositUseCase, historyUseCase) {
        this.getBalance = getBalance;
        this.depositUseCase = depositUseCase;
        this.historyUseCase = historyUseCase;
    }
    async getMyWallet(userId) {
        const wallet = await this.getBalance.execute(userId, 'user');
        return { success: true, data: wallet };
    }
    async deposit(userId, dto) {
        await this.depositUseCase.execute(userId, dto);
        return { success: true, message: 'Deposit successful' };
    }
    async getTransactions(userId, page, limit) {
        const result = await this.historyUseCase.execute(userId, 'user', page || 1, limit || 10);
        return { success: true, ...result };
    }
};
exports.UserWalletController = UserWalletController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserWalletController.prototype, "getMyWallet", null);
__decorate([
    (0, common_1.Post)('deposit'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, wallet_dto_1.DepositDto]),
    __metadata("design:returntype", Promise)
], UserWalletController.prototype, "deposit", null);
__decorate([
    (0, common_1.Get)('transactions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], UserWalletController.prototype, "getTransactions", null);
exports.UserWalletController = UserWalletController = __decorate([
    (0, common_1.Controller)('v1/wallet'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.USER),
    __metadata("design:paramtypes", [get_balance_use_case_1.GetBalanceUseCase,
        deposit_use_case_1.DepositUseCase,
        transaction_history_use_case_1.TransactionHistoryUseCase])
], UserWalletController);
//# sourceMappingURL=user-wallet.controller.js.map