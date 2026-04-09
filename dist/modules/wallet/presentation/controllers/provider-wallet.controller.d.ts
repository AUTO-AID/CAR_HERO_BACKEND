import { GetBalanceUseCase } from '../../application/use-cases/get-balance.use-case';
import { WithdrawUseCase } from '../../application/use-cases/withdraw.use-case';
import { TransactionHistoryUseCase } from '../../application/use-cases/transaction-history.use-case';
import { WithdrawDto } from '../../application/dto/wallet.dto';
export declare class ProviderWalletController {
    private readonly getBalance;
    private readonly withdrawUseCase;
    private readonly historyUseCase;
    constructor(getBalance: GetBalanceUseCase, withdrawUseCase: WithdrawUseCase, historyUseCase: TransactionHistoryUseCase);
    getMyWallet(providerId: string): Promise<{
        success: boolean;
        data: import("../../domain/entities/wallet.entity").Wallet;
    }>;
    withdraw(providerId: string, dto: WithdrawDto): Promise<{
        success: boolean;
        message: string;
    }>;
    getTransactions(providerId: string, page: number, limit: number): Promise<{
        data: import("../../domain/entities/transaction.entity").Transaction[];
        total: number;
        success: boolean;
    }>;
}
