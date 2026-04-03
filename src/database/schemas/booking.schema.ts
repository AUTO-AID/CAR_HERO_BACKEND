/**
 * Booking Schema
 * MongoDB schema for scheduled service bookings
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BookingStatus, PaymentStatus } from '../../common/enums/status.enum';

export type BookingDocument = Booking & Document;

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
export class Booking {
  @Prop({ required: true, unique: true })
  bookingNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Provider', required: true })
  provider: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Vehicle' })
  vehicle?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Service', required: true })
  service: Types.ObjectId;

  @Prop({ type: String, enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  // Scheduled date and time
  @Prop({ required: true })
  scheduledDate: Date;

  @Prop({ required: true })
  scheduledTime: string; // e.g., "09:00"

  @Prop({ required: true })
  estimatedDuration: number; // in minutes

  // Service details at time of booking
  @Prop({ required: true })
  serviceName: string;

  @Prop({ required: true })
  servicePrice: number;

  // Selected options/add-ons
  @Prop({ type: [Object], default: [] })
  selectedOptions: {
    name: string;
    price: number;
  }[];

  // Pricing
  @Prop({ required: true })
  subtotal: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ default: 0 })
  tax: number;

  @Prop({ required: true })
  total: number;

  @Prop()
  promoCode?: string;

  // Payment
  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Prop({ default: 'cash' })
  paymentMethod: string;

  @Prop()
  paymentId?: string;

  // Timing
  @Prop()
  confirmedAt?: Date;

  @Prop()
  startedAt?: Date;

  @Prop()
  completedAt?: Date;

  @Prop()
  cancelledAt?: Date;

  @Prop()
  cancellationReason?: string;

  @Prop()
  cancelledBy?: string;

  // Notes
  @Prop()
  userNotes?: string;

  @Prop()
  providerNotes?: string;

  // Reminder settings
  @Prop({ default: true })
  reminderEnabled: boolean;

  @Prop()
  reminderSentAt?: Date;

  // Rating
  @Prop({ min: 1, max: 5 })
  rating?: number;

  @Prop({ type: Types.ObjectId, ref: 'Review' })
  review?: Types.ObjectId;

  // Metadata
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

// Indexes
BookingSchema.index({ bookingNumber: 1 }, { unique: true });
BookingSchema.index({ user: 1, scheduledDate: -1 });
BookingSchema.index({ provider: 1, scheduledDate: -1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ scheduledDate: 1 });
