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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionSchema = exports.Transaction = exports.WalletSchema = exports.Wallet = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const status_enum_1 = require("../../../../../../core/enums/status.enum");
let Wallet = class Wallet {
    ownerId;
    ownerType;
    balance;
    loyaltyPoints;
    pendingBalance;
    currency;
    isActive;
    metadata;
};
exports.Wallet = Wallet;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Wallet.prototype, "ownerId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Wallet.prototype, "ownerType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Wallet.prototype, "balance", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Wallet.prototype, "loyaltyPoints", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Wallet.prototype, "pendingBalance", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'SAR' }),
    __metadata("design:type", String)
], Wallet.prototype, "currency", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Wallet.prototype, "isActive", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], Wallet.prototype, "metadata", void 0);
exports.Wallet = Wallet = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: function (doc, ret) {
                delete ret.__v;
                return ret;
            },
        },
    })
], Wallet);
exports.WalletSchema = mongoose_1.SchemaFactory.createForClass(Wallet);
exports.WalletSchema.index({ ownerId: 1, ownerType: 1 }, { unique: true });
let Transaction = class Transaction {
    transactionNumber;
    wallet;
    ownerId;
    ownerType;
    type;
    amount;
    balanceBefore;
    balanceAfter;
    description;
    referenceType;
    referenceId;
    paymentMethod;
    paymentId;
    status;
    pointsEarned;
    pointsRedeemed;
    metadata;
};
exports.Transaction = Transaction;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Transaction.prototype, "transactionNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Wallet', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Transaction.prototype, "wallet", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Transaction.prototype, "ownerId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Transaction.prototype, "ownerType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: status_enum_1.TransactionType, required: true }),
    __metadata("design:type", String)
], Transaction.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Transaction.prototype, "amount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Transaction.prototype, "balanceBefore", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Transaction.prototype, "balanceAfter", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Transaction.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Transaction.prototype, "referenceType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Transaction.prototype, "referenceId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Transaction.prototype, "paymentMethod", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Transaction.prototype, "paymentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'completed' }),
    __metadata("design:type", String)
], Transaction.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Transaction.prototype, "pointsEarned", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Transaction.prototype, "pointsRedeemed", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], Transaction.prototype, "metadata", void 0);
exports.Transaction = Transaction = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: function (doc, ret) {
                delete ret.__v;
                return ret;
            },
        },
    })
], Transaction);
exports.TransactionSchema = mongoose_1.SchemaFactory.createForClass(Transaction);
exports.TransactionSchema.index({ transactionNumber: 1 }, { unique: true });
exports.TransactionSchema.index({ wallet: 1, createdAt: -1 });
exports.TransactionSchema.index({ ownerId: 1, ownerType: 1, createdAt: -1 });
exports.TransactionSchema.index({ type: 1 });
exports.TransactionSchema.index({ referenceId: 1 });
//# sourceMappingURL=wallet.schema.js.map