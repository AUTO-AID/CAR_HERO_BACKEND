/**
 * Wallet & Transaction Schemas
 * MongoDB schemas for wallet and transaction management
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TransactionType } from '../../common/enums/status.enum';

export type WalletDocument = Wallet & Document;
export type TransactionDocument = Transaction & Document;

/**
 * Wallet Schema
 */
@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc: any, ret: any) {
      delete ret.__v;
      return ret;
    },
  },
})
export class Wallet {
  @Prop({ type: Types.ObjectId, required: true })
  ownerId: Types.ObjectId;

  @Prop({ required: true })
  ownerType: string; // user, provider

  @Prop({ default: 0 })
  balance: number;

  @Prop({ default: 0 })
  loyaltyPoints: number;

  @Prop({ default: 0 })
  pendingBalance: number;

  @Prop({ default: 'SAR' })
  currency: string;

  @Prop({ default: true })
  isActive: boolean;

  // Metadata
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);

// Indexes
WalletSchema.index({ ownerId: 1, ownerType: 1 }, { unique: true });

/**
 * Transaction Schema
 */
@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc: any, ret: any) {
      delete ret.__v;
      return ret;
    },
  },
})
export class Transaction {
  @Prop({ required: true, unique: true })
  transactionNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'Wallet', required: true })
  wallet: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  ownerId: Types.ObjectId;

  @Prop({ required: true })
  ownerType: string; // user, provider

  @Prop({ type: String, enum: TransactionType, required: true })
  type: TransactionType;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  balanceBefore: number;

  @Prop({ required: true })
  balanceAfter: number;

  @Prop({ required: true })
  description: string;

  // Reference to related entity
  @Prop()
  referenceType?: string; // order, booking, topup, withdrawal

  @Prop({ type: Types.ObjectId })
  referenceId?: Types.ObjectId;

  // Payment details
  @Prop()
  paymentMethod?: string;

  @Prop()
  paymentId?: string;

  @Prop({ default: 'completed' })
  status: string; // pending, completed, failed, reversed

  // Loyalty points
  @Prop({ default: 0 })
  pointsEarned: number;

  @Prop({ default: 0 })
  pointsRedeemed: number;

  // Metadata
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

// Indexes
TransactionSchema.index({ transactionNumber: 1 }, { unique: true });
TransactionSchema.index({ wallet: 1, createdAt: -1 });
TransactionSchema.index({ ownerId: 1, ownerType: 1, createdAt: -1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ referenceId: 1 });
