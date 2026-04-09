import { Injectable, Inject } from '@nestjs/common';
import type { IWalletRepository } from '../../domain/repositories/wallet.repository.interface';
import { Transaction } from '../../domain/entities/transaction.entity';
import { TransactionType } from '../../../../common/enums/status.enum';

@Injectable()
export class TransferEarningsUseCase {
  private readonly COMMISSION_RATE = 0.10; // 10%
  private readonly SYSTEM_OWNER_ID = 'platform_earnings';

  constructor(
    @Inject('IWalletRepository')
    private readonly walletRepository: IWalletRepository,
  ) {}

  async execute(providerId: string, grossAmount: number, referenceId: string, referenceType: 'booking' | 'order'): Promise<void> {
    const commission = grossAmount * this.COMMISSION_RATE;
    const netAmount = grossAmount - commission;

    await this.walletRepository.executeMultiWalletTransaction([
      // 1. Credit Provider (Net amount)
      {
        ownerId: providerId,
        ownerType: 'provider',
        amount: netAmount,
        type: 'deposit',
        description: `Earnings from ${referenceType} #${referenceId} (10% commission deducted: ${commission} SAR)`,
        referenceType,
        referenceId,
      },
      // 2. Credit Platform (Commission)
      {
        ownerId: this.SYSTEM_OWNER_ID,
        ownerType: 'system',
        amount: commission,
        type: 'deposit',
        description: `Commission from ${referenceType} #${referenceId} (Provider: ${providerId})`,
        referenceType,
        referenceId,
      }
    ]);
  }
}
