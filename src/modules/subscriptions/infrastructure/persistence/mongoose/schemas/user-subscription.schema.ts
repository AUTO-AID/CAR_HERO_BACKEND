/**
 * User Subscription Schema
 * Records which plan a user is currently on
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SubscriptionPlan } from './subscription-plan.schema';

export type UserSubscriptionDocument = UserSubscription & Document;

@Schema({
  timestamps: true,
  collection: 'user_subscriptions',
  toJSON: {
    virtuals: true,
    transform: function (doc: any, ret: any) {
      delete ret.__v;
      return ret;
    },
  },
})
export class UserSubscription {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: SubscriptionPlan.name, required: true })
  plan: Types.ObjectId;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ type: String, enum: ['active', 'expired', 'cancelled', 'pending'], default: 'active' })
  status: string;

  @Prop({ default: true })
  autoRenew: boolean;

  @Prop()
  cancelledAt?: Date;

  @Prop()
  lastPaymentId?: string;

  @Prop({ required: true })
  amountPaid: number;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const UserSubscriptionSchema = SchemaFactory.createForClass(UserSubscription);

UserSubscriptionSchema.index({ user: 1, status: 1 });
UserSubscriptionSchema.index({ endDate: 1 });
UserSubscriptionSchema.index({ plan: 1 });
