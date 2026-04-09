import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import type { IWalletRepository } from '../../domain/repositories/wallet.repository.interface';
import { Transaction } from '../../domain/entities/transaction.entity';
import { TransactionType } from '../../../../common/enums/status.enum';

@Injectable()
export class ProcessPayoutUseCase {
  constructor(
    @Inject('IWalletRepository')
    private readonly walletRepository: IWalletRepository,
  ) {}

  async execute(transactionId: string, action: 'complete' | 'reject', adminNote?: string): Promise<void> {
    // 1. Find the transaction
    // Need a way to find transaction by ID in repository
    // I will use a generic query logic or add a method
    const searchResult = await this.walletRepository.findAllTransactions({ _id: transactionId }, 0, 1);
    if (searchResult.total === 0) {
      throw new NotFoundException('Transaction not found');
    }

    const transaction = searchResult.data[0];

    if (transaction.status !== 'pending') {
      throw new BadRequestException('Transaction is already processed');
    }

    if (action === 'complete') {
        await this.walletRepository.updateTransactionStatus(transactionId, 'completed', { adminNote });
    } else if (action === 'reject') {
        // Return funds to the owner
        await this.walletRepository.executeTransaction(transaction.ownerId, transaction.ownerType, async (w, session) => {
            const balanceBefore = w.balance;
            w.deposit(transaction.amount); // Return the money
            const balanceAfter = w.balance;

            const reversalTx = new Transaction(
                Transaction.generateTransactionNumber(),
                w.id!,
                w.ownerId,
                w.ownerType,
                TransactionType.CREDIT,
                transaction.amount,
                balanceBefore,
                balanceAfter,
                `Payout Rejected: ${adminNote || 'No reason provided'}`,
                undefined,
                'payout_reversal',
                transaction.transactionNumber,
                undefined,
                undefined,
                'completed'
            );

            return { wallet: w, transaction: reversalTx };
        });
        
        await this.walletRepository.updateTransactionStatus(transactionId, 'failed', { adminNote });
    }
  }
}
