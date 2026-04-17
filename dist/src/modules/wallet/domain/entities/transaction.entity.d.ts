import { TransactionType } from '../../../../core/enums/status.enum';
export declare class Transaction {
    readonly transactionNumber: string;
    readonly walletId: string;
    readonly ownerId: string;
    readonly ownerType: 'user' | 'provider' | 'system';
    readonly type: TransactionType;
    readonly amount: number;
    readonly balanceBefore: number;
    readonly balanceAfter: number;
    readonly description: string;
    readonly id?: string | undefined;
    readonly referenceType?: string | undefined;
    readonly referenceId?: string | undefined;
    readonly paymentMethod?: string | undefined;
    readonly paymentId?: string | undefined;
    readonly status: 'pending' | 'completed' | 'failed' | 'reversed';
    readonly metadata: Record<string, any>;
    constructor(transactionNumber: string, walletId: string, ownerId: string, ownerType: 'user' | 'provider' | 'system', type: TransactionType, amount: number, balanceBefore: number, balanceAfter: number, description: string, id?: string | undefined, referenceType?: string | undefined, referenceId?: string | undefined, paymentMethod?: string | undefined, paymentId?: string | undefined, status?: 'pending' | 'completed' | 'failed' | 'reversed', metadata?: Record<string, any>);
    static generateTransactionNumber(): string;
}
