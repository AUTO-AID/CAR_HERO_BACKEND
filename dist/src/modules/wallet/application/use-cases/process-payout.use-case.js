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
exports.ProcessPayoutUseCase = void 0;
const common_1 = require("@nestjs/common");
const transaction_entity_1 = require("../../domain/entities/transaction.entity");
const status_enum_1 = require("../../../../core/enums/status.enum");
let ProcessPayoutUseCase = class ProcessPayoutUseCase {
    walletRepository;
    constructor(walletRepository) {
        this.walletRepository = walletRepository;
    }
    async execute(transactionId, action, adminNote) {
        const searchResult = await this.walletRepository.findAllTransactions({ _id: transactionId }, 0, 1);
        if (searchResult.total === 0) {
            throw new common_1.NotFoundException('Transaction not found');
        }
        const transaction = searchResult.data[0];
        if (transaction.status !== 'pending') {
            throw new common_1.BadRequestException('Transaction is already processed');
        }
        if (action === 'complete') {
            await this.walletRepository.updateTransactionStatus(transactionId, 'completed', { adminNote });
        }
        else if (action === 'reject') {
            await this.walletRepository.executeTransaction(transaction.ownerId, transaction.ownerType, async (w, session) => {
                const balanceBefore = w.balance;
                w.deposit(transaction.amount);
                const balanceAfter = w.balance;
                const reversalTx = new transaction_entity_1.Transaction(transaction_entity_1.Transaction.generateTransactionNumber(), w.id, w.ownerId, w.ownerType, status_enum_1.TransactionType.CREDIT, transaction.amount, balanceBefore, balanceAfter, `Payout Rejected: ${adminNote || 'No reason provided'}`, undefined, 'payout_reversal', transaction.transactionNumber, undefined, undefined, 'completed');
                return { wallet: w, transaction: reversalTx };
            });
            await this.walletRepository.updateTransactionStatus(transactionId, 'failed', { adminNote });
        }
    }
};
exports.ProcessPayoutUseCase = ProcessPayoutUseCase;
exports.ProcessPayoutUseCase = ProcessPayoutUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IWalletRepository')),
    __metadata("design:paramtypes", [Object])
], ProcessPayoutUseCase);
//# sourceMappingURL=process-payout.use-case.js.map