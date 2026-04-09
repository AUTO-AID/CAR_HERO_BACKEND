import type { IWalletRepository } from '../../domain/repositories/wallet.repository.interface';
import { Transaction } from '../../domain/entities/transaction.entity';
export declare class TransactionHistoryUseCase {
    private readonly walletRepository;
    constructor(walletRepository: IWalletRepository);
    execute(ownerId: string, ownerType: 'user' | 'provider' | 'system', page: number, limit: number): Promise<{
        data: Transaction[];
        total: number;
    }>;
}
