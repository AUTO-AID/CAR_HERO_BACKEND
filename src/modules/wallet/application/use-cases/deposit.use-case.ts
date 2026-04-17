import { Injectable, Inject } from '@nestjs/common';
import type { IWalletRepository } from '../../domain/repositories/wallet.repository.interface';
import { Transaction } from '../../domain/entities/transaction.entity';
import { TransactionType } from '../../../../core/enums/status.enum';
import { DepositDto } from '../dto/wallet.dto';
import { GetBalanceUseCase } from './get-balance.use-case';

@Injectable()
export class DepositUseCase {
  constructor(
    @Inject('IWalletRepository')
    private readonly walletRepository: IWalletRepository,
    private readonly getBalance: GetBalanceUseCase,
  ) {}

  async execute(userId: string, dto: DepositDto): Promise<void> {
    await this.walletRepository.executeTransaction(userId, 'user', async (wallet, session) => {
      const balanceBefore = wallet.balance;
      wallet.deposit(dto.amount);
      const balanceAfter = wallet.balance;

      const transaction = new Transaction(
        Transaction.generateTransactionNumber(),
        wallet.id!,
        userId,
        'user',
        TransactionType.CREDIT,
        dto.amount,
        balanceBefore,
        balanceAfter,
        `Wallet top-up via ${dto.paymentMethod || 'online'}`,
        undefined,
        'topup',
        undefined,
        dto.paymentMethod,
        dto.paymentId
      );

      return { wallet, transaction };
    });
  }
}
