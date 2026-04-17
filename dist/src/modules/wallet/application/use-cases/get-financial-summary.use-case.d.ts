import type { IWalletRepository } from '../../domain/repositories/wallet.repository.interface';
export declare class GetFinancialSummaryUseCase {
    private readonly walletRepository;
    constructor(walletRepository: IWalletRepository);
    execute(): Promise<{
        platformBalance: number;
        totalCommissionEarned: number;
        totalPayoutsProcessed: number;
        currency: string;
    }>;
}
