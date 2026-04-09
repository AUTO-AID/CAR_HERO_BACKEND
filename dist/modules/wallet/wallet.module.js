"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const wallet_schema_1 = require("../../database/schemas/wallet.schema");
const mongoose_wallet_repository_1 = require("./infrastructure/persistence/mongoose-wallet.repository");
const user_wallet_controller_1 = require("./presentation/controllers/user-wallet.controller");
const provider_wallet_controller_1 = require("./presentation/controllers/provider-wallet.controller");
const admin_wallet_controller_1 = require("./presentation/controllers/admin-wallet.controller");
const get_balance_use_case_1 = require("./application/use-cases/get-balance.use-case");
const deposit_use_case_1 = require("./application/use-cases/deposit.use-case");
const withdraw_use_case_1 = require("./application/use-cases/withdraw.use-case");
const transfer_earnings_use_case_1 = require("./application/use-cases/transfer-earnings.use-case");
const transaction_history_use_case_1 = require("./application/use-cases/transaction-history.use-case");
let WalletModule = class WalletModule {
};
exports.WalletModule = WalletModule;
exports.WalletModule = WalletModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: wallet_schema_1.Wallet.name, schema: wallet_schema_1.WalletSchema },
                { name: wallet_schema_1.Transaction.name, schema: wallet_schema_1.TransactionSchema },
            ]),
        ],
        controllers: [
            user_wallet_controller_1.UserWalletController,
            provider_wallet_controller_1.ProviderWalletController,
            admin_wallet_controller_1.AdminWalletController
        ],
        providers: [
            {
                provide: 'IWalletRepository',
                useClass: mongoose_wallet_repository_1.MongooseWalletRepository,
            },
            get_balance_use_case_1.GetBalanceUseCase,
            deposit_use_case_1.DepositUseCase,
            withdraw_use_case_1.WithdrawUseCase,
            transfer_earnings_use_case_1.TransferEarningsUseCase,
            transaction_history_use_case_1.TransactionHistoryUseCase
        ],
        exports: [
            'IWalletRepository',
            get_balance_use_case_1.GetBalanceUseCase,
            transfer_earnings_use_case_1.TransferEarningsUseCase,
        ],
    })
], WalletModule);
//# sourceMappingURL=wallet.module.js.map