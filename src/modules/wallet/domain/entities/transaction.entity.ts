import { TransactionType } from '../../../../core/enums/status.enum';

export class Transaction {
  constructor(
    public readonly transactionNumber: string,
    public readonly walletId: string,
    public readonly ownerId: string,
    public readonly ownerType: 'user' | 'provider' | 'system',
    public readonly type: TransactionType,
    public readonly amount: number,
    public readonly balanceBefore: number,
    public readonly balanceAfter: number,
    public readonly description: string,
    public readonly id?: string,
    public readonly referenceType?: string,
    public readonly referenceId?: string,
    public readonly paymentMethod?: string,
    public readonly paymentId?: string,
    public readonly status: 'pending' | 'completed' | 'failed' | 'reversed' = 'completed',
    public readonly metadata: Record<string, any> = {},
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  static generateTransactionNumber(): string {
    return `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }
}
