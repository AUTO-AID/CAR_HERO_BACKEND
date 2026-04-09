import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallet, WalletSchema, Transaction, TransactionSchema } from '../../database/schemas/wallet.schema';
import { MongooseWalletRepository } from './infrastructure/persistence/mongoose-wallet.repository';

// Controllers
import { UserWalletController } from './presentation/controllers/user-wallet.controller';
import { ProviderWalletController } from './presentation/controllers/provider-wallet.controller';
import { AdminWalletController } from './presentation/controllers/admin-wallet.controller';

// Use Cases
import { GetBalanceUseCase } from './application/use-cases/get-balance.use-case';
import { DepositUseCase } from './application/use-cases/deposit.use-case';
import { WithdrawUseCase } from './application/use-cases/withdraw.use-case';
import { TransferEarningsUseCase } from './application/use-cases/transfer-earnings.use-case';
import { TransactionHistoryUseCase } from './application/use-cases/transaction-history.use-case';
import { RequestPayoutUseCase } from './application/use-cases/request-payout.use-case';
import { ProcessPayoutUseCase } from './application/use-cases/process-payout.use-case';
import { GetAdminTransactionLogsUseCase } from './application/use-cases/get-admin-transaction-logs.use-case';
import { GetFinancialSummaryUseCase } from './application/use-cases/get-financial-summary.use-case';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wallet.name, schema: WalletSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  controllers: [
    UserWalletController,
    ProviderWalletController,
    AdminWalletController
  ],
  providers: [
    {
      provide: 'IWalletRepository',
      useClass: MongooseWalletRepository,
    },
    GetBalanceUseCase,
    DepositUseCase,
    WithdrawUseCase,
    TransferEarningsUseCase,
    TransactionHistoryUseCase,
    RequestPayoutUseCase,
    ProcessPayoutUseCase,
    GetAdminTransactionLogsUseCase,
    GetFinancialSummaryUseCase,
  ],
  exports: [
    'IWalletRepository',
    GetBalanceUseCase,
    TransferEarningsUseCase,
  ],
})
export class WalletModule {}
