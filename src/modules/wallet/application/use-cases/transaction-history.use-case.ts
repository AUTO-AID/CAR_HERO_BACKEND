import { Injectable, Inject } from '@nestjs/common';
import type { IWalletRepository } from '../../domain/repositories/wallet.repository.interface';
import { Transaction } from '../../domain/entities/transaction.entity';

@Injectable()
export class TransactionHistoryUseCase {
  constructor(
    @Inject('IWalletRepository')
    private readonly walletRepository: IWalletRepository,
  ) {}

  async execute(ownerId: string, ownerType: 'user' | 'provider' | 'system', page: number, limit: number): Promise<{ data: Transaction[], total: number }> {
    const skip = (page - 1) * limit;
    return await this.walletRepository.findTransactionsByOwnerId(ownerId, ownerType, skip, limit);
  }
}
