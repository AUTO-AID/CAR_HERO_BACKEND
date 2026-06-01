import { Injectable, Inject } from '@nestjs/common';
import type { IWalletRepository } from '../../domain/repositories/wallet.repository.interface';
import { TransactionType } from '../../../../core/enums/status.enum';

@Injectable()
export class GetFinancialSummaryUseCase {
  constructor(
    @Inject('IWalletRepository')
    private readonly walletRepository: IWalletRepository,
  ) {}

  async execute() {
    const SYSTEM_OWNER_ID = 'platform_earnings';
    const platformWallet = await this.walletRepository.findByOwnerId(SYSTEM_OWNER_ID, 'system');

    const [orderPayments, providerEarnings, completedPayouts, pendingPayouts, allTransactions] = await Promise.all([
      this.walletRepository.findAllTransactions({
        referenceType: 'order',
        status: 'completed',
        type: TransactionType.DEBIT,
        ownerType: 'user',
      }, 0, 1000000),
      this.walletRepository.findAllTransactions({
        referenceType: 'order',
        status: 'completed',
        type: TransactionType.CREDIT,
        ownerType: 'provider',
      }, 0, 1000000),
      this.walletRepository.findAllTransactions({
        referenceType: { $in: ['payout', 'withdrawal'] },
        status: 'completed',
        type: TransactionType.DEBIT,
        ownerType: 'provider',
      }, 0, 1000000),
      this.walletRepository.findAllTransactions({
        referenceType: { $in: ['payout', 'withdrawal'] },
        status: 'pending',
        type: TransactionType.DEBIT,
        ownerType: 'provider',
      }, 0, 1000000),
      this.walletRepository.findAllTransactions({}, 0, 1),
    ]);

    const totalOrderRevenue = orderPayments.data.reduce((sum, tx) => sum + tx.amount, 0);
    const totalProviderEarnings = providerEarnings.data.reduce((sum, tx) => sum + tx.amount, 0);
    const totalCommissionEarned = Math.max(totalOrderRevenue - totalProviderEarnings, 0);
    const totalPayoutsProcessed = completedPayouts.data.reduce((sum, tx) => sum + tx.amount, 0);
    const pendingPayoutsAmount = pendingPayouts.data.reduce((sum, tx) => sum + tx.amount, 0);

    return {
      platformBalance: platformWallet && platformWallet.balance > 0 ? platformWallet.balance : totalCommissionEarned,
      totalCommissionEarned,
      totalOrderRevenue,
      totalProviderEarnings,
      totalPayoutsProcessed,
      pendingPayoutsAmount,
      pendingPayoutsCount: pendingPayouts.total,
      transactionsCount: allTransactions.total,
      currency: platformWallet?.currency || 'SYP',
    };
  }
}
