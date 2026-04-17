import type { IWalletRepository } from '../../domain/repositories/wallet.repository.interface';
export declare class ProcessPayoutUseCase {
    private readonly walletRepository;
    constructor(walletRepository: IWalletRepository);
    execute(transactionId: string, action: 'complete' | 'reject', adminNote?: string): Promise<void>;
}
