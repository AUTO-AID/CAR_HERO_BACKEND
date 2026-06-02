import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallet, WalletSchema, Transaction, TransactionSchema } from './infrastructure/persistence/mongoose/schemas/wallet.schema';
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
import { GetProviderFinancialSummaryUseCase } from './application/use-cases/get-provider-financial-summary.use-case';
import { RedeemLoyaltyPointsUseCase } from './application/use-cases/redeem-loyalty-points.use-case';
import { Setting, SettingSchema } from '../admin/infrastructure/persistence/mongoose/schemas/setting.schema';
import { Order, OrderSchema } from '../orders/infrastructure/persistence/mongoose/schemas/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wallet.name, schema: WalletSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: Setting.name, schema: SettingSchema },
      { name: Order.name, schema: OrderSchema },
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
    GetProviderFinancialSummaryUseCase,
    RedeemLoyaltyPointsUseCase,
  ],
  exports: [
    'IWalletRepository',
    GetBalanceUseCase,
    TransferEarningsUseCase,
  ],
})
export class WalletModule {}
