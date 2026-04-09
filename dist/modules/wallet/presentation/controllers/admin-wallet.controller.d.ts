import { GetBalanceUseCase } from '../../application/use-cases/get-balance.use-case';
import { TransactionHistoryUseCase } from '../../application/use-cases/transaction-history.use-case';
export declare class AdminWalletController {
    private readonly getBalance;
    private readonly historyUseCase;
    constructor(getBalance: GetBalanceUseCase, historyUseCase: TransactionHistoryUseCase);
    private readonly SYSTEM_OWNER_ID;
    getPlatformWallet(): Promise<{
        success: boolean;
        data: import("../../domain/entities/wallet.entity").Wallet;
    }>;
    getPlatformTransactions(page: number, limit: number): Promise<{
        data: import("../../domain/entities/transaction.entity").Transaction[];
        total: number;
        success: boolean;
    }>;
    getWallet(ownerId: string, type: 'user' | 'provider' | 'system'): Promise<{
        success: boolean;
        data: import("../../domain/entities/wallet.entity").Wallet;
    }>;
    getTransactions(ownerId: string, type: 'user' | 'provider' | 'system', page: number, limit: number): Promise<{
        data: import("../../domain/entities/transaction.entity").Transaction[];
        total: number;
        success: boolean;
    }>;
    adjustBalance(ownerId: string, dto: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
