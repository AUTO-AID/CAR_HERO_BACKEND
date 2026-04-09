import { Injectable, Inject } from '@nestjs/common';
import type { IWalletRepository } from '../../domain/repositories/wallet.repository.interface';
import { Transaction } from '../../domain/entities/transaction.entity';

@Injectable()
export class GetAdminTransactionLogsUseCase {
  constructor(
    @Inject('IWalletRepository')
    private readonly walletRepository: IWalletRepository,
  ) {}

  async execute(page: number = 1, limit: number = 10, filters: any = {}) {
    const skip = (page - 1) * limit;
    
    // Process filters (e.g., date range, type, ownerId)
    const processedFilters: any = {};
    
    if (filters.type) processedFilters.type = filters.type;
    if (filters.ownerType) processedFilters.ownerType = filters.ownerType;
    if (filters.status) processedFilters.status = filters.status;
    if (filters.referenceType) processedFilters.referenceType = filters.referenceType;
    
    // Date range filtering
    if (filters.startDate || filters.endDate) {
      processedFilters.createdAt = {};
      if (filters.startDate) processedFilters.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) processedFilters.createdAt.$lte = new Date(filters.endDate);
    }

    return this.walletRepository.findAllTransactions(processedFilters, skip, limit);
  }
}
