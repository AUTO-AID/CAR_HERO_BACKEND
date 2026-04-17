import type { IWalletRepository } from '../../domain/repositories/wallet.repository.interface';
import { WithdrawDto } from '../dto/wallet.dto';
export declare class RequestPayoutUseCase {
    private readonly walletRepository;
    constructor(walletRepository: IWalletRepository);
    execute(providerId: string, dto: WithdrawDto): Promise<void>;
}
