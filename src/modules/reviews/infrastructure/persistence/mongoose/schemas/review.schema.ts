/**
 * Review Schema
 * MongoDB schema for service reviews and ratings
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

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ default: false })
  isReported: boolean;

  @Prop()
  reportReason?: string;

  // Provider response
  @Prop({
    type: {
      comment: String,
      repliedAt: { type: Date, default: Date.now },
    },
  })
  response?: {
    comment: string;
    repliedAt: Date;
  };
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// Indexes
ReviewSchema.index({ provider: 1, createdAt: -1 });
ReviewSchema.index({ user: 1 });
ReviewSchema.index({ order: 1 }, { unique: true, sparse: true });
ReviewSchema.index({ booking: 1 }, { unique: true, sparse: true });
ReviewSchema.index({ rating: -1 });
