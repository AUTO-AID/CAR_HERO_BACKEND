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
exports.RequestPayoutUseCase = void 0;
const common_1 = require("@nestjs/common");
const transaction_entity_1 = require("../../domain/entities/transaction.entity");
const status_enum_1 = require("../../../../core/enums/status.enum");
let RequestPayoutUseCase = class RequestPayoutUseCase {
    walletRepository;
    constructor(walletRepository) {
        this.walletRepository = walletRepository;
    }
    async execute(providerId, dto) {
        const wallet = await this.walletRepository.findByOwnerId(providerId, 'provider');
        if (!wallet) {
            throw new common_1.BadRequestException('Wallet not found');
        }
        if (wallet.balance < dto.amount) {
            throw new common_1.BadRequestException('Insufficient balance');
        }
        await this.walletRepository.executeTransaction(providerId, 'provider', async (w, session) => {
            const balanceBefore = w.balance;
            w.withdraw(dto.amount);
            const balanceAfter = w.balance;
            const transaction = new transaction_entity_1.Transaction(transaction_entity_1.Transaction.generateTransactionNumber(), w.id, w.ownerId, w.ownerType, status_enum_1.TransactionType.DEBIT, dto.amount, balanceBefore, balanceAfter, `Payout request to ${dto.bankName || 'bank'} (${dto.bankAccount})`, undefined, 'payout', undefined, 'bank_transfer', undefined, 'pending', {
                bankAccount: dto.bankAccount,
                bankName: dto.bankName,
            });
            return { wallet: w, transaction };
        });
    }
};
exports.RequestPayoutUseCase = RequestPayoutUseCase;
exports.RequestPayoutUseCase = RequestPayoutUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IWalletRepository')),
    __metadata("design:paramtypes", [Object])
], RequestPayoutUseCase);
//# sourceMappingURL=request-payout.use-case.js.map