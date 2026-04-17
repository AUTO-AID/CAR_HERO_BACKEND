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
exports.DepositUseCase = void 0;
const common_1 = require("@nestjs/common");
const transaction_entity_1 = require("../../domain/entities/transaction.entity");
const status_enum_1 = require("../../../../core/enums/status.enum");
const get_balance_use_case_1 = require("./get-balance.use-case");
let DepositUseCase = class DepositUseCase {
    walletRepository;
    getBalance;
    constructor(walletRepository, getBalance) {
        this.walletRepository = walletRepository;
        this.getBalance = getBalance;
    }
    async execute(userId, dto) {
        await this.walletRepository.executeTransaction(userId, 'user', async (wallet, session) => {
            const balanceBefore = wallet.balance;
            wallet.deposit(dto.amount);
            const balanceAfter = wallet.balance;
            const transaction = new transaction_entity_1.Transaction(transaction_entity_1.Transaction.generateTransactionNumber(), wallet.id, userId, 'user', status_enum_1.TransactionType.CREDIT, dto.amount, balanceBefore, balanceAfter, `Wallet top-up via ${dto.paymentMethod || 'online'}`, undefined, 'topup', undefined, dto.paymentMethod, dto.paymentId);
            return { wallet, transaction };
        });
    }
};
exports.DepositUseCase = DepositUseCase;
exports.DepositUseCase = DepositUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IWalletRepository')),
    __metadata("design:paramtypes", [Object, get_balance_use_case_1.GetBalanceUseCase])
], DepositUseCase);
//# sourceMappingURL=deposit.use-case.js.map