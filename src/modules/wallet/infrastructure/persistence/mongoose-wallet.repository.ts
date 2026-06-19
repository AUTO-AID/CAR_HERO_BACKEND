import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types, ClientSession } from 'mongoose';
import { IWalletRepository } from '../../domain/repositories/wallet.repository.interface';
import { Wallet as WalletEntity } from '../../domain/entities/wallet.entity';
import { Transaction as TransactionEntity } from '../../domain/entities/transaction.entity';
import { Wallet, WalletDocument, Transaction, TransactionDocument } from './mongoose/schemas/wallet.schema';
import { TransactionType } from '../../../../core/enums/status.enum';

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

  private mapTransactionToEntity(doc: TransactionDocument | any): TransactionEntity {
    const source: any = typeof doc?.toObject === 'function' ? doc.toObject() : doc;
    const entity = new TransactionEntity(
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
      source.createdAt,
      source.updatedAt,
    );
    return Object.assign(entity, {
      _id: source._id?.toString?.() || entity.id,
      id: source._id?.toString?.() || entity.id,
      createdAt: source.createdAt,
      updatedAt: source.updatedAt,
      ownerName: source.ownerName,
      ownerPhone: source.ownerPhone,
      providerName: source.providerName || source.ownerName,
      bankAccount: source.metadata?.bankAccount,
      bankName: source.metadata?.bankName,
    });
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
      referenceId: transaction.referenceId && Types.ObjectId.isValid(transaction.referenceId) ? new Types.ObjectId(transaction.referenceId) : null,
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
    const {
      __search,
      __dateFrom,
      __dateTo,
      __sortBy = 'createdAt',
      __sortOrder = 'desc',
      ...rawFilter
    } = filter || {};
    const normalizedFilter = this.normalizeTransactionFilter(rawFilter);
    const createdAt: Record<string, Date> = {};
    if (__dateFrom) {
      const from = new Date(__dateFrom);
      if (!Number.isNaN(from.getTime())) createdAt.$gte = from;
    }
    if (__dateTo) {
      const to = new Date(__dateTo);
      if (!Number.isNaN(to.getTime())) {
        to.setHours(23, 59, 59, 999);
        createdAt.$lte = to;
      }
    }
    if (Object.keys(createdAt).length) normalizedFilter.createdAt = createdAt;
    const sortField = ['createdAt', 'updatedAt', 'amount', 'type', 'status', 'ownerType', 'referenceType'].includes(__sortBy)
      ? __sortBy
      : 'createdAt';
    const sortDirection = __sortOrder === 'asc' ? 1 : -1;
    const pipeline: any[] = [
      { $match: normalizedFilter },
      {
        $lookup: {
          from: 'users',
          localField: 'ownerId',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      {
        $lookup: {
          from: 'providers',
          localField: 'ownerId',
          foreignField: '_id',
          as: 'providerDetails',
        },
      },
      {
        $addFields: {
          ownerName: {
            $ifNull: [
              { $first: '$providerDetails.businessName' },
              { $ifNull: [{ $first: '$userDetails.fullName' }, '$ownerType'] },
            ],
          },
          ownerPhone: {
            $ifNull: [
              { $first: '$providerDetails.phone' },
              { $first: '$userDetails.phoneNumber' },
            ],
          },
          providerName: { $first: '$providerDetails.businessName' },
          referenceIdText: { $toString: '$referenceId' },
        },
      },
    ];

    if (__search) {
      const regex = new RegExp(this.escapeRegex(String(__search).trim()), 'i');
      pipeline.push({
        $match: {
          $or: [
            { transactionNumber: regex },
            { description: regex },
            { referenceType: regex },
            { referenceIdText: regex },
            { paymentMethod: regex },
            { paymentId: regex },
            { ownerName: regex },
            { ownerPhone: regex },
          ],
        },
      });
    }

    pipeline.push(
      { $sort: { [sortField]: sortDirection, _id: -1 } },
      {
        $facet: {
          data: [
            { $skip: Math.max(0, skip) },
            { $limit: Math.max(1, limit) },
            { $project: { userDetails: 0, providerDetails: 0, referenceIdText: 0 } },
          ],
          meta: [{ $count: 'total' }],
        },
      },
    );

    const [result] = await this.transactionModel.aggregate(pipeline).exec();
    const docs = result?.data || [];
    const total = result?.meta?.[0]?.total || 0;
    return {
      data: docs.map(doc => this.mapTransactionToEntity(doc)),
      total,
    };
  }

  private normalizeTransactionFilter(filter: any): any {
    const normalized: any = { ...filter };
    for (const key of ['_id', 'ownerId', 'referenceId', 'wallet']) {
      if (typeof normalized[key] === 'string' && Types.ObjectId.isValid(normalized[key])) {
        normalized[key] = new Types.ObjectId(normalized[key]);
      }
    }
    return normalized;
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async updateTransactionStatus(id: string, status: string, metadata?: any, session?: ClientSession): Promise<void> {
    const update: any = { status };
    if (metadata) {
      update.metadata = metadata;
    }
    await this.transactionModel.findByIdAndUpdate(id, update, { session }).exec();
  }

  async executeTransaction(ownerId: string, ownerType: string, operation: (wallet: WalletEntity, session?: ClientSession) => Promise<{ wallet: WalletEntity; transaction: TransactionEntity; }>): Promise<void> {
    try {
      const session = await this.connection.startSession();
      session.startTransaction();
      try {
        let wallet = await this.findByOwnerId(ownerId, ownerType as any);
        if (!wallet) {
          wallet = await this.createWallet(new WalletEntity(ownerId, ownerType as any, 0));
        }
        
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
    } catch (transactionError: any) {
      const errMsg = transactionError?.message || '';
      if (
        errMsg.includes('Transaction numbers are only allowed') ||
        errMsg.includes('replica set') ||
        errMsg.includes('transactions')
      ) {
        let wallet = await this.findByOwnerId(ownerId, ownerType as any);
        if (!wallet) {
          wallet = await this.createWallet(new WalletEntity(ownerId, ownerType as any, 0));
        }
        
        const { wallet: updatedWallet, transaction } = await operation(wallet);
        
        await this.updateWallet(updatedWallet);
        await this.createTransaction(transaction);
      } else {
        throw transactionError;
      }
    }
  }

  async executeMultiWalletTransaction(
    walletsToUpdate: { ownerId: string, ownerType: string, amount: number, type: 'deposit' | 'withdraw', description: string, referenceType?: string, referenceId?: string }[]
  ): Promise<void> {
    try {
      const session = await this.connection.startSession();
      session.startTransaction();
      try {
        for (const update of walletsToUpdate) {
          let wallet = await this.findByOwnerId(update.ownerId, update.ownerType as any);
          
          // Lazy create wallet if it doesn't exist
          if (!wallet) {
            wallet = await this.createWallet(new WalletEntity(update.ownerId, update.ownerType as any, 0));
          }

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
    } catch (transactionError: any) {
      const errMsg = transactionError?.message || '';
      if (
        errMsg.includes('Transaction numbers are only allowed') ||
        errMsg.includes('replica set') ||
        errMsg.includes('transactions')
      ) {
        for (const update of walletsToUpdate) {
          let wallet = await this.findByOwnerId(update.ownerId, update.ownerType as any);
          
          // Lazy create wallet if it doesn't exist
          if (!wallet) {
            wallet = await this.createWallet(new WalletEntity(update.ownerId, update.ownerType as any, 0));
          }

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

          await this.updateWallet(wallet);
          await this.createTransaction(transaction);
        }
      } else {
        throw transactionError;
      }
    }
  }
}
