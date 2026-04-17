"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
class Transaction {
    transactionNumber;
    walletId;
    ownerId;
    ownerType;
    type;
    amount;
    balanceBefore;
    balanceAfter;
    description;
    id;
    referenceType;
    referenceId;
    paymentMethod;
    paymentId;
    status;
    metadata;
    constructor(transactionNumber, walletId, ownerId, ownerType, type, amount, balanceBefore, balanceAfter, description, id, referenceType, referenceId, paymentMethod, paymentId, status = 'completed', metadata = {}) {
        this.transactionNumber = transactionNumber;
        this.walletId = walletId;
        this.ownerId = ownerId;
        this.ownerType = ownerType;
        this.type = type;
        this.amount = amount;
        this.balanceBefore = balanceBefore;
        this.balanceAfter = balanceAfter;
        this.description = description;
        this.id = id;
        this.referenceType = referenceType;
        this.referenceId = referenceId;
        this.paymentMethod = paymentMethod;
        this.paymentId = paymentId;
        this.status = status;
        this.metadata = metadata;
    }
    static generateTransactionNumber() {
        return `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    }
}
exports.Transaction = Transaction;
//# sourceMappingURL=transaction.entity.js.map