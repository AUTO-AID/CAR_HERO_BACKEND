/**
 * Subscription Schema
 * MongoDB schema for platform subscriptions (packages)
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

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
export class Subscription {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  nameAr: string;

  @Prop()
  description?: string;

  @Prop()
  descriptionAr?: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  durationDays: number;

  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop({ type: [String], default: [] })
  featuresAr: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: String, enum: ['basic', 'silver', 'gold', 'platinum'], default: 'basic' })
  tier: string;

  // Metadata
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

// Indexes
SubscriptionSchema.index({ isActive: 1 });
SubscriptionSchema.index({ tier: 1 });
