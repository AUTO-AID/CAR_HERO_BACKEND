import { Wallet } from '../entities/wallet.entity';
import { Transaction } from '../entities/transaction.entity';

export interface IWalletRepository {
  findByOwnerId(ownerId: string, ownerType: 'user' | 'provider' | 'system'): Promise<Wallet | null>;
  createWallet(wallet: Wallet): Promise<Wallet>;
  updateWallet(wallet: Wallet, session?: any): Promise<Wallet>;
  
  createTransaction(transaction: Transaction, session?: any): Promise<Transaction>;
  findTransactionsByOwnerId(ownerId: string, ownerType: 'user' | 'provider' | 'system', skip: number, limit: number): Promise<{ data: Transaction[], total: number }>;
  
  // Advanced Atomic operation
  executeTransaction(ownerId: string, ownerType: string, operation: (wallet: Wallet, session: any) => Promise<{wallet: Wallet, transaction: Transaction}>): Promise<void>;
  
  executeMultiWalletTransaction(
    walletsToUpdate: { ownerId: string, ownerType: string, amount: number, type: 'deposit' | 'withdraw', description: string, referenceType?: string, referenceId?: string }[]
  ): Promise<void>;
}
