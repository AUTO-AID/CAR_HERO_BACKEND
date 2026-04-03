/**
 * Promo Code Schema
 * MongoDB schema for promotional codes
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PromoCodeDocument = PromoCode & Document;

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
export class PromoCode {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  discountType: string; // percentage, fixed

  @Prop({ required: true })
  discountValue: number;

  @Prop()
  maxDiscount?: number; // Maximum discount amount for percentage type

  @Prop({ required: true })
  minOrderAmount: number;

  @Prop()
  maxUsageTotal?: number; // Total usage limit

  @Prop()
  maxUsagePerUser?: number; // Usage limit per user

  @Prop({ default: 0 })
  usedCount: number;

  @Prop({ type: [Types.ObjectId], default: [] })
  usedBy: Types.ObjectId[]; // Array of user IDs who used this code

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ default: true })
  isActive: boolean;

  // Targeting
  @Prop({ type: [String], default: [] })
  applicableServices: string[]; // Empty means all services

  @Prop({ default: false })
  newUsersOnly: boolean;

  @Prop({ default: false })
  subscribersOnly: boolean;

  // Metadata
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const PromoCodeSchema = SchemaFactory.createForClass(PromoCode);

// Indexes
PromoCodeSchema.index({ code: 1 }, { unique: true });
PromoCodeSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
