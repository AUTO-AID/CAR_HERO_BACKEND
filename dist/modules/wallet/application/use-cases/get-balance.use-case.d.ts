import type { IWalletRepository } from '../../domain/repositories/wallet.repository.interface';
import { Wallet } from '../../domain/entities/wallet.entity';
export declare class GetBalanceUseCase {
    private readonly walletRepository;
    constructor(walletRepository: IWalletRepository);
    execute(ownerId: string, ownerType: 'user' | 'provider' | 'system'): Promise<Wallet>;
}
