import { Wallet } from '../entities/wallet.entity';
import { Transaction } from '../entities/transaction.entity';

export interface IWalletRepository {
  findByOwnerId(ownerId: string, ownerType: 'user' | 'provider' | 'system'): Promise<Wallet | null>;
  createWallet(wallet: Wallet): Promise<Wallet>;
  updateWallet(wallet: Wallet, session?: any): Promise<Wallet>;
  
  createTransaction(transaction: Transaction, session?: any): Promise<Transaction>;
  findTransactionsByOwnerId(ownerId: string, ownerType: 'user' | 'provider' | 'system', skip: number, limit: number): Promise<{ data: Transaction[], total: number }>;
  findAllTransactions(filter: any, skip: number, limit: number): Promise<{ data: Transaction[], total: number }>;
  updateTransactionStatus(id: string, status: string, metadata?: any, session?: any): Promise<void>;
  // Advanced Atomic operation
  executeTransaction(ownerId: string, ownerType: string, operation: (wallet: Wallet, session: any) => Promise<{wallet: Wallet, transaction: Transaction}>): Promise<void>;
  
  /**
   * `allowNegative` يسمح للسحب أن يُنزل الرصيد تحت الصفر بدل أن يرمي.
   *
   * يلزم حيث يكون السالب **معلومةً لا خطأ**: عمولةُ طلبٍ نُقد قبضه الفنّي بيده
   * دَيْنٌ عليه، ومحفظته قد تكون فارغة لحظة الاستحقاق. وحارس «الرصيد غير كافٍ»
   * كان يمنع تسجيل الحالة التي يهمّ تسجيلها أكثر من غيرها. انظر
   * `TransferEarningsUseCase` — وهو النمط نفسه الذي اتّخذه `recordPromotionalCost`.
   */
  executeMultiWalletTransaction(
    walletsToUpdate: { ownerId: string, ownerType: string, amount: number, type: 'deposit' | 'withdraw', description: string, referenceType?: string, referenceId?: string, allowNegative?: boolean }[]
  ): Promise<void>;
}
