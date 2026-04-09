import { Injectable, Inject } from '@nestjs/common';
import type { IWalletRepository } from '../../domain/repositories/wallet.repository.interface';
import { TransactionType } from '../../../../common/enums/status.enum';

@Injectable()
export class GetFinancialSummaryUseCase {
  constructor(
    @Inject('IWalletRepository')
    private readonly walletRepository: IWalletRepository,
  ) {}

  async execute() {
    const SYSTEM_OWNER_ID = 'platform_earnings';
    
    // 1. Get Platform Balance
    const platformWallet = await this.walletRepository.findByOwnerId(SYSTEM_OWNER_ID, 'system');
    
    // 2. Get Total Completed Payouts
    const payouts = await this.walletRepository.findAllTransactions({
        referenceType: 'payout',
        status: 'completed',
        type: TransactionType.DEBIT
    }, 0, 1000000); // Simple hack for total, a real aggregate is better

    const totalPayouts = payouts.data.reduce((sum, tx) => sum + tx.amount, 0);

    return {
      platformBalance: platformWallet?.balance || 0,
      totalCommissionEarned: platformWallet?.balance || 0, // In this model, these are equivalent
      totalPayoutsProcessed: totalPayouts,
      currency: platformWallet?.currency || 'SAR',
    };
  }
}
