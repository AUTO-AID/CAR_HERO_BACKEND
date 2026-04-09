import { GetBalanceUseCase } from '../../application/use-cases/get-balance.use-case';
import { DepositUseCase } from '../../application/use-cases/deposit.use-case';
import { TransactionHistoryUseCase } from '../../application/use-cases/transaction-history.use-case';
import { DepositDto } from '../../application/dto/wallet.dto';
export declare class UserWalletController {
    private readonly getBalance;
    private readonly depositUseCase;
    private readonly historyUseCase;
    constructor(getBalance: GetBalanceUseCase, depositUseCase: DepositUseCase, historyUseCase: TransactionHistoryUseCase);
    getMyWallet(userId: string): Promise<{
        success: boolean;
        data: import("../../domain/entities/wallet.entity").Wallet;
    }>;
    deposit(userId: string, dto: DepositDto): Promise<{
        success: boolean;
        message: string;
    }>;
    getTransactions(userId: string, page: number, limit: number): Promise<{
        data: import("../../domain/entities/transaction.entity").Transaction[];
        total: number;
        success: boolean;
    }>;
}
