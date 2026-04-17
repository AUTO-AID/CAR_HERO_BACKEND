import type { IWalletRepository } from '../../domain/repositories/wallet.repository.interface';
export declare class TransferEarningsUseCase {
    private readonly walletRepository;
    private readonly COMMISSION_RATE;
    private readonly SYSTEM_OWNER_ID;
    constructor(walletRepository: IWalletRepository);
    execute(providerId: string, grossAmount: number, referenceId: string, referenceType: 'booking' | 'order'): Promise<void>;
}
