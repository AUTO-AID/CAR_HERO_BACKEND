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

  async executeFiltered(
    ownerId: string,
    ownerType: 'user' | 'provider' | 'system',
    query: Record<string, any>,
  ): Promise<{ data: Transaction[]; total: number; pagination: { page: number; limit: number; pages: number } }> {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;
    const filter: Record<string, any> = { ownerId, ownerType };

    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;
    if (query.referenceType) filter.referenceType = query.referenceType;
    if (query.search) filter.__search = query.search;
    if (query.dateFrom) filter.__dateFrom = query.dateFrom;
    if (query.dateTo) filter.__dateTo = query.dateTo;
    if (query.sortBy) filter.__sortBy = query.sortBy;
    if (query.sortOrder) filter.__sortOrder = query.sortOrder;

    const result = await this.walletRepository.findAllTransactions(filter, skip, limit);
    return {
      ...result,
      pagination: {
        page,
        limit,
        pages: Math.ceil(result.total / limit),
      },
    };
  }

  async exportFiltered(ownerId: string, ownerType: 'user' | 'provider' | 'system', query: Record<string, any>) {
    const filter: Record<string, any> = { ownerId, ownerType };
    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;
    if (query.referenceType) filter.referenceType = query.referenceType;
    if (query.search) filter.__search = query.search;
    if (query.dateFrom) filter.__dateFrom = query.dateFrom;
    if (query.dateTo) filter.__dateTo = query.dateTo;
    if (query.sortBy) filter.__sortBy = query.sortBy;
    if (query.sortOrder) filter.__sortOrder = query.sortOrder;
    return this.walletRepository.findAllTransactions(filter, 0, 10000);
  }
}
