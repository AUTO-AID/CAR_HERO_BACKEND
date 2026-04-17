"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Wallet = void 0;
class Wallet {
    ownerId;
    ownerType;
    balance;
    pendingBalance;
    loyaltyPoints;
    currency;
    isActive;
    id;
    metadata;
    constructor(ownerId, ownerType, balance = 0, pendingBalance = 0, loyaltyPoints = 0, currency = 'SAR', isActive = true, id, metadata = {}) {
        this.ownerId = ownerId;
        this.ownerType = ownerType;
        this.balance = balance;
        this.pendingBalance = pendingBalance;
        this.loyaltyPoints = loyaltyPoints;
        this.currency = currency;
        this.isActive = isActive;
        this.id = id;
        this.metadata = metadata;
    }
    hasSufficientBalance(amount) {
        return this.balance >= amount;
    }
    deposit(amount) {
        if (amount <= 0)
            throw new Error('Deposit amount must be positive');
        this.balance += amount;
    }
    withdraw(amount) {
        if (amount <= 0)
            throw new Error('Withdrawal amount must be positive');
        if (!this.hasSufficientBalance(amount))
            throw new Error('Insufficient balance');
        this.balance -= amount;
    }
    addPendingBalance(amount) {
        this.pendingBalance += amount;
    }
    confirmPendingBalance(amount) {
        if (this.pendingBalance < amount)
            throw new Error('Insufficient pending balance');
        this.pendingBalance -= amount;
        this.balance += amount;
    }
}
exports.Wallet = Wallet;
//# sourceMappingURL=wallet.entity.js.map