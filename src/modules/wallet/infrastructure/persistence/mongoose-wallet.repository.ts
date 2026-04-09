import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types, ClientSession } from 'mongoose';
import { IWalletRepository } from '../../domain/repositories/wallet.repository.interface';
import { Wallet as WalletEntity } from '../../domain/entities/wallet.entity';
import { Transaction as TransactionEntity } from '../../domain/entities/transaction.entity';
import { Wallet, WalletDocument, Transaction, TransactionDocument } from '../../../../database/schemas/wallet.schema';
import { TransactionType } from '../../../../common/enums/status.enum';

@Injectable()
export class MongooseWalletRepository implements IWalletRepository {
  constructor(
    @InjectModel(Wallet.name) private readonly walletModel: Model<WalletDocument>,
    @InjectModel(Transaction.name) private readonly transactionModel: Model<TransactionDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  private mapWalletToEntity(doc: WalletDocument): WalletEntity {
    return new WalletEntity(
      doc.ownerId?.toString() || '',
      doc.ownerType as any,
      doc.balance,
      doc.pendingBalance,
      doc.loyaltyPoints,
      doc.currency,
      doc.isActive,
      doc._id.toString(),
      doc.metadata,
    );
  }

  private mapTransactionToEntity(doc: TransactionDocument): TransactionEntity {
    return new TransactionEntity(
      doc.transactionNumber,
      doc.wallet?.toString() || '',
      doc.ownerId?.toString() || '',
      doc.ownerType as any,
      doc.type,
      doc.amount,
      doc.balanceBefore,
      doc.balanceAfter,
      doc.description,
      doc._id.toString(),
      doc.referenceType,
      doc.referenceId?.toString(),
      doc.paymentMethod,
      doc.paymentId,
      doc.status as any,
      doc.metadata,
    );
  }

  async findByOwnerId(ownerId: string, ownerType: 'user' | 'provider' | 'system'): Promise<WalletEntity | null> {
    const filter: any = { ownerType };
    // system identifier might be a string literal, not necessarily a valid ObjectId
    if (Types.ObjectId.isValid(ownerId)) {
      filter.ownerId = new Types.ObjectId(ownerId);
    } else {
      filter.ownerId = ownerId;
    }
    const doc = await this.walletModel.findOne(filter).exec();
    return doc ? this.mapWalletToEntity(doc) : null;
  }

  async createWallet(wallet: WalletEntity): Promise<WalletEntity> {
    const doc = new this.walletModel({
      ownerId: Types.ObjectId.isValid(wallet.ownerId) ? new Types.ObjectId(wallet.ownerId) : wallet.ownerId,
      ownerType: wallet.ownerType,
      balance: wallet.balance,
      pendingBalance: wallet.pendingBalance,
       loyaltyPoints: wallet.loyaltyPoints,
      currency: wallet.currency,
      isActive: wallet.isActive,
      metadata: wallet.metadata,
    });
    const saved = await doc.save();
    return this.mapWalletToEntity(saved);
  }

  async updateWallet(wallet: WalletEntity, session?: ClientSession): Promise<WalletEntity> {
    const doc = await this.walletModel.findByIdAndUpdate(
      wallet.id,
      {
        balance: wallet.balance,
        pendingBalance: wallet.pendingBalance,
        loyaltyPoints: wallet.loyaltyPoints,
        isActive: wallet.isActive,
        metadata: wallet.metadata,
      },
      { new: true, session },
    ).exec();
    if (!doc) throw new Error('Wallet not found');
    return this.mapWalletToEntity(doc);
  }

  async createTransaction(transaction: TransactionEntity, session?: ClientSession): Promise<TransactionEntity> {
    const doc = new this.transactionModel({
      transactionNumber: transaction.transactionNumber,
      wallet: new Types.ObjectId(transaction.walletId),
      ownerId: Types.ObjectId.isValid(transaction.ownerId) ? new Types.ObjectId(transaction.ownerId) : transaction.ownerId,
      ownerType: transaction.ownerType,
      type: transaction.type,
      amount: transaction.amount,
      balanceBefore: transaction.balanceBefore,
      balanceAfter: transaction.balanceAfter,
      description: transaction.description,
      referenceType: transaction.referenceType,
      referenceId: transaction.referenceId ? new Types.ObjectId(transaction.referenceId) : null,
      paymentMethod: transaction.paymentMethod,
      paymentId: transaction.paymentId,
      status: transaction.status,
      metadata: transaction.metadata,
    });
    const saved = await doc.save({ session });
    return this.mapTransactionToEntity(saved);
  }

  async findTransactionsByOwnerId(ownerId: string, ownerType: 'user' | 'provider' | 'system', skip: number, limit: number): Promise<{ data: TransactionEntity[]; total: number; }> {
    const filter: any = { ownerType };
    if (Types.ObjectId.isValid(ownerId)) {
        filter.ownerId = new Types.ObjectId(ownerId);
    } else {
        filter.ownerId = ownerId;
    }
    const [docs, total] = await Promise.all([
      this.transactionModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.transactionModel.countDocuments(filter),
    ]);
    return {
      data: docs.map(doc => this.mapTransactionToEntity(doc)),
      total,
    };
  }

  async findAllTransactions(filter: any, skip: number, limit: number): Promise<{ data: TransactionEntity[]; total: number; }> {
    const [docs, total] = await Promise.all([
      this.transactionModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.transactionModel.countDocuments(filter),
    ]);
    return {
      data: docs.map(doc => this.mapTransactionToEntity(doc)),
      total,
    };
  }

  async updateTransactionStatus(id: string, status: string, metadata?: any): Promise<void> {
    const update: any = { status };
    if (metadata) {
      update.metadata = metadata;
    }
    await this.transactionModel.findByIdAndUpdate(id, update).exec();
  }

  async executeTransaction(ownerId: string, ownerType: string, operation: (wallet: WalletEntity, session: ClientSession) => Promise<{ wallet: WalletEntity; transaction: TransactionEntity; }>): Promise<void> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const wallet = await this.findByOwnerId(ownerId, ownerType as any);
      if (!wallet) throw new Error(`Wallet not found for ${ownerType} ${ownerId}`);
      
      const { wallet: updatedWallet, transaction } = await operation(wallet, session);
      
      await this.updateWallet(updatedWallet, session);
      await this.createTransaction(transaction, session);
      
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async executeMultiWalletTransaction(
    walletsToUpdate: { ownerId: string, ownerType: string, amount: number, type: 'deposit' | 'withdraw', description: string, referenceType?: string, referenceId?: string }[]
  ): Promise<void> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      for (const update of walletsToUpdate) {
        let wallet = await this.findByOwnerId(update.ownerId, update.ownerType as any);
        
        // Lazy create for system wallet if it doesn't exist
        if (!wallet && update.ownerType === 'system') {
          wallet = await this.createWallet(new WalletEntity(update.ownerId, 'system', 0));
        }

        if (!wallet) throw new Error(`Wallet not found for ${update.ownerType} ${update.ownerId}`);

        const balanceBefore = wallet.balance;
        if (update.type === 'deposit') {
          wallet.deposit(update.amount);
        } else {
          wallet.withdraw(update.amount);
        }
        const balanceAfter = wallet.balance;

        const transaction = new TransactionEntity(
          TransactionEntity.generateTransactionNumber(),
          wallet.id!,
          wallet.ownerId,
          wallet.ownerType,
          update.type === 'deposit' ? TransactionType.CREDIT : TransactionType.DEBIT,
          update.amount,
          balanceBefore,
          balanceAfter,
          update.description,
          undefined,
          update.referenceType as any,
          update.referenceId,
          undefined,
          undefined,
          'completed'
        );

        await this.updateWallet(wallet, session);
        await this.createTransaction(transaction, session);
      }
      
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
