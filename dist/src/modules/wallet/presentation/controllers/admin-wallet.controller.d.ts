import { GetBalanceUseCase } from '../../application/use-cases/get-balance.use-case';
import { TransactionHistoryUseCase } from '../../application/use-cases/transaction-history.use-case';
import { GetAdminTransactionLogsUseCase } from '../../application/use-cases/get-admin-transaction-logs.use-case';
import { GetFinancialSummaryUseCase } from '../../application/use-cases/get-financial-summary.use-case';
import { ProcessPayoutUseCase } from '../../application/use-cases/process-payout.use-case';
export declare class AdminWalletController {
    private readonly getBalance;
    private readonly historyUseCase;
    private readonly adminLogsUseCase;
    private readonly financialSummary;
    private readonly processPayout;
    constructor(getBalance: GetBalanceUseCase, historyUseCase: TransactionHistoryUseCase, adminLogsUseCase: GetAdminTransactionLogsUseCase, financialSummary: GetFinancialSummaryUseCase, processPayout: ProcessPayoutUseCase);
    private readonly SYSTEM_OWNER_ID;
    getStats(): Promise<{
        success: boolean;
        data: {
            platformBalance: number;
            totalCommissionEarned: number;
            totalPayoutsProcessed: number;
            currency: string;
        };
    }>;
    getAllTransactions(page: number, limit: number, filters: any): Promise<{
        data: import("../../domain/entities/transaction.entity").Transaction[];
        total: number;
        success: boolean;
    }>;
    handlePayout(id: string, action: 'complete' | 'reject', note: string): Promise<{
        success: boolean;
        message: string;
    }>;
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
