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
    throw new Error('Direct deposits are disabled for security reasons. Please use the /api/payments/initialize endpoint to generate a secure checkout URL via Cham Cash.');
  }
}
