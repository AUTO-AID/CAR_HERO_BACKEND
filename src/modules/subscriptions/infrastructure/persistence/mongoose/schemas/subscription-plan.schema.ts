/**
 * Subscription Plan Schema
 * Defines the available subscription packages
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SubscriptionPlanDocument = SubscriptionPlan & Document;

@Schema({
  timestamps: true,
  collection: 'subscription_plans',
  toJSON: {
    virtuals: true,
    transform: function (doc: any, ret: any) {
      delete ret.__v;
      return ret;
    },
  },
})
export class SubscriptionPlan {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  nameAr: string;

  @Prop()
  description?: string;

  @Prop()
  descriptionAr?: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true, min: 1 })
  durationDays: number;

  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop({ type: [String], default: [] })
  featuresAr: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: String, enum: ['basic', 'silver', 'gold', 'platinum'], default: 'basic' })
  tier: string;

  @Prop({ default: 0 })
  sortOrder: number;

  // Metadata for extensibility
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const SubscriptionPlanSchema = SchemaFactory.createForClass(SubscriptionPlan);

SubscriptionPlanSchema.index({ isActive: 1 });
SubscriptionPlanSchema.index({ tier: 1 });
SubscriptionPlanSchema.index({ sortOrder: 1 });
