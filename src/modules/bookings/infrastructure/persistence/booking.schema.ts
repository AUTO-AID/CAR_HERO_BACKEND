import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BookingStatus } from '../../domain/enums/booking-status.enum';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';

@Schema({ _id: false })
export class LocationSchema {
  @Prop({ type: String, enum: ['Point'], default: 'Point' })
  type: string;

  @Prop({ type: [Number], required: true })
  coordinates: number[]; // [longitude, latitude]

  @Prop({ type: String })
  address: string;
}

@Schema({ timestamps: true })
export class BookingDocument extends Document {
  @Prop({ type: String, required: true, unique: true })
  bookingNumber: string;

  @Prop({ type: Boolean, default: false })
  isScheduled: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Provider' }) // Optional Provider
  provider: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Vehicle' })
  vehicle: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Service', required: true })
  service: Types.ObjectId;

  @Prop({ type: String, enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @Prop({ type: LocationSchema, required: true })
  location: LocationSchema;

  @Prop({ type: Date })
  scheduledDate: Date;

  @Prop({ type: String })
  scheduledTime: string;

  @Prop({ type: Number })
  estimatedDuration: number;

  @Prop({ type: String, required: true })
  serviceName: string;

  @Prop({ type: Number, required: true })
  servicePrice: number;

  @Prop({ type: [{ name: String, price: Number }], default: [] })
  selectedOptions: Array<{ name: string; price: number }>;

  @Prop({ type: Number, required: true })
  subtotal: number;

  @Prop({ type: Number, default: 0 })
  discount: number;

  @Prop({ type: Number, default: 0 })
  tax: number;

  @Prop({ type: Number, required: true })
  total: number;

  @Prop({ type: String })
  promoCode: string;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Prop({ type: String })
  paymentMethod: string;

  @Prop({ type: String })
  paymentId: string;

  @Prop({ type: Date })
  confirmedAt: Date;

  @Prop({ type: Date })
  startedAt: Date;

  @Prop({ type: Date })
  completedAt: Date;

  @Prop({ type: Date })
  cancelledAt: Date;

  @Prop({ type: String })
  cancellationReason: string;

  @Prop({ type: String })
  cancelledBy: string;

  @Prop({ type: String })
  userNotes: string;

  @Prop({ type: String })
  providerNotes: string;

  @Prop({ type: Boolean, default: false })
  reminderEnabled: boolean;

  @Prop({ type: Date })
  reminderSentAt: Date;

  @Prop({ type: Number })
  rating: number;

  @Prop({ type: Types.ObjectId, ref: 'Review' })
  review: Types.ObjectId;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const BookingSchema = SchemaFactory.createForClass(BookingDocument);

// Adding Indexes for frequent queries including geospatial index
BookingSchema.index({ status: 1 });
BookingSchema.index({ user: 1 });
BookingSchema.index({ provider: 1 });
BookingSchema.index({ scheduledDate: 1 });
BookingSchema.index({ location: '2dsphere' });
