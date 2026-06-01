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
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(500, Math.max(1, Number(limit) || 10));
    const skip = (safePage - 1) * safeLimit;
    const processedFilters: any = {};

    if (filters.type && filters.type !== 'all') processedFilters.type = String(filters.type).toLowerCase();
    if (filters.ownerType && filters.ownerType !== 'all') processedFilters.ownerType = String(filters.ownerType).toLowerCase();
    if (filters.status && filters.status !== 'all') processedFilters.status = String(filters.status).toLowerCase();
    if (filters.ownerId) processedFilters.ownerId = filters.ownerId;
    if (filters.referenceId) processedFilters.referenceId = filters.referenceId;
    if (filters.referenceType && filters.referenceType !== 'all') {
      const values = String(filters.referenceType)
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      processedFilters.referenceType = values.length > 1 ? { $in: values } : values[0];
    }

    const amount: any = {};
    if (filters.amountMin !== undefined && filters.amountMin !== '') amount.$gte = Number(filters.amountMin);
    if (filters.amountMax !== undefined && filters.amountMax !== '') amount.$lte = Number(filters.amountMax);
    if (Object.keys(amount).length) processedFilters.amount = amount;

    const startDate = filters.startDate || filters.dateFrom;
    const endDate = filters.endDate || filters.dateTo;
    if (startDate || endDate) {
      processedFilters.createdAt = {};
      if (startDate) processedFilters.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        if (/^\d{4}-\d{2}-\d{2}$/.test(String(endDate))) {
          end.setHours(23, 59, 59, 999);
        }
        processedFilters.createdAt.$lte = end;
      }
    }

    if (filters.search || filters.q) processedFilters.__search = filters.search || filters.q;
    processedFilters.__sortBy = filters.sortBy || 'createdAt';
    processedFilters.__sortOrder = filters.sortOrder || 'desc';

    const result = await this.walletRepository.findAllTransactions(processedFilters, skip, safeLimit);
    return {
      data: result.data,
      total: result.total,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / safeLimit)),
      },
    };
  }
}
