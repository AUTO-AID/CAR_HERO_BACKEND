import { Injectable, Inject } from '@nestjs/common';
import type { IWalletRepository } from '../../domain/repositories/wallet.repository.interface';
import { Wallet } from '../../domain/entities/wallet.entity';

@Injectable()
export class GetBalanceUseCase {
  constructor(
    @Inject('IWalletRepository')
    private readonly walletRepository: IWalletRepository,
  ) {}

  async execute(ownerId: string, ownerType: 'user' | 'provider' | 'system'): Promise<Wallet> {
    let wallet = await this.walletRepository.findByOwnerId(ownerId, ownerType);
    
    if (!wallet) {
      // Auto-create wallet if it doesn't exist (Lazy initialization)
      wallet = new Wallet(ownerId, ownerType);
      wallet = await this.walletRepository.createWallet(wallet);
    }
    
    return wallet;
  }
}
