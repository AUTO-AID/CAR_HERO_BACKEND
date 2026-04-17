import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IWalletRepository } from '../../domain/repositories/wallet.repository.interface';
import { Transaction } from '../../domain/entities/transaction.entity';
import { TransactionType, PayoutStatus } from '../../../../core/enums/status.enum';
import { WithdrawDto } from '../dto/wallet.dto';

@Injectable()
export class RequestPayoutUseCase {
  constructor(
    @Inject('IWalletRepository')
    private readonly walletRepository: IWalletRepository,
  ) {}

  async execute(providerId: string, dto: WithdrawDto): Promise<void> {
    const wallet = await this.walletRepository.findByOwnerId(providerId, 'provider');
    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    if (wallet.balance < dto.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    // Create a pending debit transaction
    // In a real system, we might move the balance to 'pendingBalance' fields
    // For simplicity, we'll keep it in 'balance' but mark the transaction as pending
    // Or actually, let's deduct it now to 'reserve' the funds
    
    await this.walletRepository.executeTransaction(providerId, 'provider', async (w, session) => {
      const balanceBefore = w.balance;
      w.withdraw(dto.amount); // Deduct from available balance
      const balanceAfter = w.balance;

      const transaction = new Transaction(
        Transaction.generateTransactionNumber(),
        w.id!,
        w.ownerId,
        w.ownerType,
        TransactionType.DEBIT,
        dto.amount,
        balanceBefore,
        balanceAfter,
        `Payout request to ${dto.bankName || 'bank'} (${dto.bankAccount})`,
        undefined,
        'payout',
        undefined,
        'bank_transfer',
        undefined,
        'pending', // STATUS IS PENDING
        {
          bankAccount: dto.bankAccount,
          bankName: dto.bankName,
        }
      );

      return { wallet: w, transaction };
    });
  }
}
