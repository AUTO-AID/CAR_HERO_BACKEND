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
exports.GetFinancialSummaryUseCase = void 0;
const common_1 = require("@nestjs/common");
const status_enum_1 = require("../../../../core/enums/status.enum");
let GetFinancialSummaryUseCase = class GetFinancialSummaryUseCase {
    walletRepository;
    constructor(walletRepository) {
        this.walletRepository = walletRepository;
    }
    async execute() {
        const SYSTEM_OWNER_ID = 'platform_earnings';
        const platformWallet = await this.walletRepository.findByOwnerId(SYSTEM_OWNER_ID, 'system');
        const payouts = await this.walletRepository.findAllTransactions({
            referenceType: 'payout',
            status: 'completed',
            type: status_enum_1.TransactionType.DEBIT
        }, 0, 1000000);
        const totalPayouts = payouts.data.reduce((sum, tx) => sum + tx.amount, 0);
        return {
            platformBalance: platformWallet?.balance || 0,
            totalCommissionEarned: platformWallet?.balance || 0,
            totalPayoutsProcessed: totalPayouts,
            currency: platformWallet?.currency || 'SAR',
        };
    }
};
exports.GetFinancialSummaryUseCase = GetFinancialSummaryUseCase;
exports.GetFinancialSummaryUseCase = GetFinancialSummaryUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IWalletRepository')),
    __metadata("design:paramtypes", [Object])
], GetFinancialSummaryUseCase);
//# sourceMappingURL=get-financial-summary.use-case.js.map