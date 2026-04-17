/**
 * PromoCode Schema
 * MongoDB schema for discount coupons
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code: string;

  @Prop({ required: true, enum: ['percentage', 'fixed'] })
  type: string;

  @Prop({ required: true, min: 0 })
  value: number;

  @Prop({ required: true })
  expiryDate: Date;

  @Prop({ default: 0 })
  usageLimit: number; // 0 for unlimited

  @Prop({ default: 0 })
  usageCount: number;

  @Prop({ min: 0 })
  minOrderAmount?: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [String], default: [] })
  applicableServices: string[];
}

export const PromoCodeSchema = SchemaFactory.createForClass(PromoCode);

PromoCodeSchema.index({ code: 1 }, { unique: true });
PromoCodeSchema.index({ isActive: 1, expiryDate: 1 });
