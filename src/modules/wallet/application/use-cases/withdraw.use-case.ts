import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IWalletRepository } from '../../domain/repositories/wallet.repository.interface';
import { Transaction } from '../../domain/entities/transaction.entity';
import { TransactionType } from '../../../../common/enums/status.enum';
import { WithdrawDto } from '../dto/wallet.dto';

@Injectable()
export class WithdrawUseCase {
  constructor(
    @Inject('IWalletRepository')
    private readonly walletRepository: IWalletRepository,
  ) {}

  async execute(providerId: string, dto: WithdrawDto): Promise<void> {
    await this.walletRepository.executeTransaction(providerId, 'provider', async (wallet, session) => {
      if (wallet.balance < dto.amount) {
        throw new BadRequestException('Insufficient balance for withdrawal');
      }

      const balanceBefore = wallet.balance;
      wallet.withdraw(dto.amount);
      const balanceAfter = wallet.balance;

      const transaction = new Transaction(
        Transaction.generateTransactionNumber(),
        wallet.id!,
        providerId,
        'provider',
        TransactionType.DEBIT,
        dto.amount,
        balanceBefore,
        balanceAfter,
        `Withdrawal to bank account: ${dto.bankAccount}`,
        undefined,
        'withdrawal',
        undefined,
        'bank_transfer',
        undefined,
        'pending', // Withdrawals might need admin approval
        { bankAccount: dto.bankAccount, bankName: dto.bankName }
      );

      return { wallet, transaction };
    });
  }
}
