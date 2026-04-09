"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongooseWalletRepository = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const wallet_entity_1 = require("../../domain/entities/wallet.entity");
const transaction_entity_1 = require("../../domain/entities/transaction.entity");
const wallet_schema_1 = require("../../../../database/schemas/wallet.schema");
const status_enum_1 = require("../../../../common/enums/status.enum");
let MongooseWalletRepository = class MongooseWalletRepository {
    walletModel;
    transactionModel;
    connection;
    constructor(walletModel, transactionModel, connection) {
        this.walletModel = walletModel;
        this.transactionModel = transactionModel;
        this.connection = connection;
    }
    mapWalletToEntity(doc) {
        return new wallet_entity_1.Wallet(doc.ownerId?.toString() || '', doc.ownerType, doc.balance, doc.pendingBalance, doc.loyaltyPoints, doc.currency, doc.isActive, doc._id.toString(), doc.metadata);
    }
    mapTransactionToEntity(doc) {
        return new transaction_entity_1.Transaction(doc.transactionNumber, doc.wallet?.toString() || '', doc.ownerId?.toString() || '', doc.ownerType, doc.type, doc.amount, doc.balanceBefore, doc.balanceAfter, doc.description, doc._id.toString(), doc.referenceType, doc.referenceId?.toString(), doc.paymentMethod, doc.paymentId, doc.status, doc.metadata);
    }
    async findByOwnerId(ownerId, ownerType) {
        const filter = { ownerType };
        if (mongoose_2.Types.ObjectId.isValid(ownerId)) {
            filter.ownerId = new mongoose_2.Types.ObjectId(ownerId);
        }
        else {
            filter.ownerId = ownerId;
        }
        const doc = await this.walletModel.findOne(filter).exec();
        return doc ? this.mapWalletToEntity(doc) : null;
    }
    async createWallet(wallet) {
        const doc = new this.walletModel({
            ownerId: mongoose_2.Types.ObjectId.isValid(wallet.ownerId) ? new mongoose_2.Types.ObjectId(wallet.ownerId) : wallet.ownerId,
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
    async updateWallet(wallet, session) {
        const doc = await this.walletModel.findByIdAndUpdate(wallet.id, {
            balance: wallet.balance,
            pendingBalance: wallet.pendingBalance,
            loyaltyPoints: wallet.loyaltyPoints,
            isActive: wallet.isActive,
            metadata: wallet.metadata,
        }, { new: true, session }).exec();
        if (!doc)
            throw new Error('Wallet not found');
        return this.mapWalletToEntity(doc);
    }
    async createTransaction(transaction, session) {
        const doc = new this.transactionModel({
            transactionNumber: transaction.transactionNumber,
            wallet: new mongoose_2.Types.ObjectId(transaction.walletId),
            ownerId: mongoose_2.Types.ObjectId.isValid(transaction.ownerId) ? new mongoose_2.Types.ObjectId(transaction.ownerId) : transaction.ownerId,
            ownerType: transaction.ownerType,
            type: transaction.type,
            amount: transaction.amount,
            balanceBefore: transaction.balanceBefore,
            balanceAfter: transaction.balanceAfter,
            description: transaction.description,
            referenceType: transaction.referenceType,
            referenceId: transaction.referenceId ? new mongoose_2.Types.ObjectId(transaction.referenceId) : null,
            paymentMethod: transaction.paymentMethod,
            paymentId: transaction.paymentId,
            status: transaction.status,
            metadata: transaction.metadata,
        });
        const saved = await doc.save({ session });
        return this.mapTransactionToEntity(saved);
    }
    async findTransactionsByOwnerId(ownerId, ownerType, skip, limit) {
        const filter = { ownerType };
        if (mongoose_2.Types.ObjectId.isValid(ownerId)) {
            filter.ownerId = new mongoose_2.Types.ObjectId(ownerId);
        }
        else {
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
    async executeTransaction(ownerId, ownerType, operation) {
        const session = await this.connection.startSession();
        session.startTransaction();
        try {
            const wallet = await this.findByOwnerId(ownerId, ownerType);
            if (!wallet)
                throw new Error(`Wallet not found for ${ownerType} ${ownerId}`);
            const { wallet: updatedWallet, transaction } = await operation(wallet, session);
            await this.updateWallet(updatedWallet, session);
            await this.createTransaction(transaction, session);
            await session.commitTransaction();
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    async executeMultiWalletTransaction(walletsToUpdate) {
        const session = await this.connection.startSession();
        session.startTransaction();
        try {
            for (const update of walletsToUpdate) {
                let wallet = await this.findByOwnerId(update.ownerId, update.ownerType);
                if (!wallet && update.ownerType === 'system') {
                    wallet = await this.createWallet(new wallet_entity_1.Wallet(update.ownerId, 'system', 0));
                }
                if (!wallet)
                    throw new Error(`Wallet not found for ${update.ownerType} ${update.ownerId}`);
                const balanceBefore = wallet.balance;
                if (update.type === 'deposit') {
                    wallet.deposit(update.amount);
                }
                else {
                    wallet.withdraw(update.amount);
                }
                const balanceAfter = wallet.balance;
                const transaction = new transaction_entity_1.Transaction(transaction_entity_1.Transaction.generateTransactionNumber(), wallet.id, wallet.ownerId, wallet.ownerType, update.type === 'deposit' ? status_enum_1.TransactionType.CREDIT : status_enum_1.TransactionType.DEBIT, update.amount, balanceBefore, balanceAfter, update.description, undefined, update.referenceType, update.referenceId, undefined, undefined, 'completed');
                await this.updateWallet(wallet, session);
                await this.createTransaction(transaction, session);
            }
            await session.commitTransaction();
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
};
exports.MongooseWalletRepository = MongooseWalletRepository;
exports.MongooseWalletRepository = MongooseWalletRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(wallet_schema_1.Wallet.name)),
    __param(1, (0, mongoose_1.InjectModel)(wallet_schema_1.Transaction.name)),
    __param(2, (0, mongoose_1.InjectConnection)()),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Connection])
], MongooseWalletRepository);
//# sourceMappingURL=mongoose-wallet.repository.js.map