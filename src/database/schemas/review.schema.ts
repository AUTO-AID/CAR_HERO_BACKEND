/**
 * Review Schema
 * MongoDB schema for ratings and reviews
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReviewDocument = Review & Document;

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
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Provider', required: true })
  provider: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  order?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Booking' })
  booking?: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop()
  comment?: string;

  // Detailed ratings
  @Prop({ min: 1, max: 5 })
  serviceQuality?: number;

  @Prop({ min: 1, max: 5 })
  punctuality?: number;

  @Prop({ min: 1, max: 5 })
  professionalism?: number;

  @Prop({ min: 1, max: 5 })
  valueForMoney?: number;

  // Images attached to review
  @Prop({ type: [String], default: [] })
  images: string[];

  // Provider response
  @Prop()
  providerResponse?: string;

  @Prop()
  providerRespondedAt?: Date;

  // Moderation
  @Prop({ default: true })
  isVisible: boolean;

  @Prop({ default: false })
  isFlagged: boolean;

  @Prop()
  flagReason?: string;

  // Helpfulness votes
  @Prop({ default: 0 })
  helpfulCount: number;

  @Prop({ type: [Types.ObjectId], default: [] })
  helpfulVoters: Types.ObjectId[];

  // Metadata
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// Indexes
ReviewSchema.index({ provider: 1, createdAt: -1 });
ReviewSchema.index({ user: 1, createdAt: -1 });
ReviewSchema.index({ order: 1 }, { sparse: true });
ReviewSchema.index({ booking: 1 }, { sparse: true });
ReviewSchema.index({ rating: -1 });
