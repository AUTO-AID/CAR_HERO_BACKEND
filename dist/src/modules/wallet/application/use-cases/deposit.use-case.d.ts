import type { IWalletRepository } from '../../domain/repositories/wallet.repository.interface';
import { DepositDto } from '../dto/wallet.dto';
import { GetBalanceUseCase } from './get-balance.use-case';
export declare class DepositUseCase {
    private readonly walletRepository;
    private readonly getBalance;
    constructor(walletRepository: IWalletRepository, getBalance: GetBalanceUseCase);
    execute(userId: string, dto: DepositDto): Promise<void>;
}
