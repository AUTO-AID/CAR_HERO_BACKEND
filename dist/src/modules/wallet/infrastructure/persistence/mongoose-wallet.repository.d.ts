import { Model, Connection, ClientSession } from 'mongoose';
import { IWalletRepository } from '../../domain/repositories/wallet.repository.interface';
import { Wallet as WalletEntity } from '../../domain/entities/wallet.entity';
import { Transaction as TransactionEntity } from '../../domain/entities/transaction.entity';
import { WalletDocument, TransactionDocument } from './mongoose/schemas/wallet.schema';
export declare class MongooseWalletRepository implements IWalletRepository {
    private readonly walletModel;
    private readonly transactionModel;
    private readonly connection;
    constructor(walletModel: Model<WalletDocument>, transactionModel: Model<TransactionDocument>, connection: Connection);
    private mapWalletToEntity;
    private mapTransactionToEntity;
    findByOwnerId(ownerId: string, ownerType: 'user' | 'provider' | 'system'): Promise<WalletEntity | null>;
    createWallet(wallet: WalletEntity): Promise<WalletEntity>;
    updateWallet(wallet: WalletEntity, session?: ClientSession): Promise<WalletEntity>;
    createTransaction(transaction: TransactionEntity, session?: ClientSession): Promise<TransactionEntity>;
    findTransactionsByOwnerId(ownerId: string, ownerType: 'user' | 'provider' | 'system', skip: number, limit: number): Promise<{
        data: TransactionEntity[];
        total: number;
    }>;
    findAllTransactions(filter: any, skip: number, limit: number): Promise<{
        data: TransactionEntity[];
        total: number;
    }>;
    updateTransactionStatus(id: string, status: string, metadata?: any): Promise<void>;
    executeTransaction(ownerId: string, ownerType: string, operation: (wallet: WalletEntity, session: ClientSession) => Promise<{
        wallet: WalletEntity;
        transaction: TransactionEntity;
    }>): Promise<void>;
    executeMultiWalletTransaction(walletsToUpdate: {
        ownerId: string;
        ownerType: string;
        amount: number;
        type: 'deposit' | 'withdraw';
        description: string;
        referenceType?: string;
        referenceId?: string;
    }[]): Promise<void>;
}
