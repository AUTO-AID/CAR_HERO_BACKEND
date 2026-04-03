/**
 * Subscription & Plan Schemas
 * MongoDB schemas for premium subscriptions
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SubscriptionStatus } from '../../common/enums/status.enum';

export type SubscriptionPlanDocument = SubscriptionPlan & Document;
export type SubscriptionDocument = Subscription & Document;

/**
 * Plan Benefits Schema
 */
@Schema({ _id: false })
class PlanBenefit {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  nameAr: string;

  @Prop()
  description?: string;

  @Prop()
  value?: string; // e.g., "10%", "Unlimited", "5 times"
}

/**
 * Subscription Plan Schema
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
export class SubscriptionPlan {
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

  @Prop({ default: 'SAR' })
  currency: string;

  @Prop({ type: [PlanBenefit], default: [] })
  benefits: PlanBenefit[];

  // Discount percentages
  @Prop({ default: 0 })
  serviceDiscount: number;

  @Prop({ default: 0 })
  emergencyDiscount: number;

  // Free services included
  @Prop({ default: 0 })
  freeEmergencyServices: number;

  @Prop({ default: 0 })
  freeTowingKm: number;

  // Priority
  @Prop({ default: false })
  prioritySupport: boolean;

  @Prop({ default: 0 })
  loyaltyPointsMultiplier: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: 0 })
  sortOrder: number;

  // Metadata
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const SubscriptionPlanSchema = SchemaFactory.createForClass(SubscriptionPlan);

// Indexes
SubscriptionPlanSchema.index({ isActive: 1, sortOrder: 1 });

/**
 * Subscription Schema
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
export class Subscription {
  @Prop({ required: true, unique: true })
  subscriptionNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SubscriptionPlan', required: true })
  plan: Types.ObjectId;

  @Prop({ type: String, enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE })
  status: SubscriptionStatus;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true })
  paidAmount: number;

  @Prop()
  paymentMethod?: string;

  @Prop()
  paymentId?: string;

  // Usage tracking
  @Prop({ default: 0 })
  emergencyServicesUsed: number;

  @Prop({ default: 0 })
  towingKmUsed: number;

  // Auto-renewal
  @Prop({ default: false })
  autoRenew: boolean;

  @Prop()
  renewedAt?: Date;

  @Prop()
  cancelledAt?: Date;

  @Prop()
  cancellationReason?: string;

  // Metadata
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

// Indexes
SubscriptionSchema.index({ subscriptionNumber: 1 }, { unique: true });
SubscriptionSchema.index({ user: 1, status: 1 });
SubscriptionSchema.index({ endDate: 1 });
