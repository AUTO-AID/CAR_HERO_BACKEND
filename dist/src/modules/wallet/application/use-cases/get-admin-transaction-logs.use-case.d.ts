import type { IWalletRepository } from '../../domain/repositories/wallet.repository.interface';
import { Transaction } from '../../domain/entities/transaction.entity';
export declare class GetAdminTransactionLogsUseCase {
    private readonly walletRepository;
    constructor(walletRepository: IWalletRepository);
    execute(page?: number, limit?: number, filters?: any): Promise<{
        data: Transaction[];
        total: number;
    }>;
}
