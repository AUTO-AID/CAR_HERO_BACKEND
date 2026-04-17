/**
 * Booking Schema
 * MongoDB schema for scheduled services
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BookingStatus, PaymentStatus } from '../../../../../../core/enums/status.enum';

export type BookingDocument = Booking & Document;

@Schema({ _id: false })
class GeoLocation {
  @Prop({ type: String, enum: ['Point'], default: 'Point' })
  type: string;

  @Prop({ type: [Number], required: true })
  coordinates: number[]; // [longitude, latitude]
}

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

  @Prop({ type: Types.ObjectId, ref: 'Provider' })
  provider?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Service', required: true })
  service: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Vehicle', required: true })
  vehicle: Types.ObjectId;

  @Prop({ type: String, enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @Prop({ required: true })
  scheduledDate: Date;

  @Prop({ required: true })
  totalPrice: number;

  @Prop({ type: GeoLocation, required: true })
  location: GeoLocation;

  @Prop()
  address?: string;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Prop()
  paymentMethod?: string;

  @Prop()
  userNotes?: string;

  @Prop({ type: Types.ObjectId, ref: 'Review' })
  review?: Types.ObjectId;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

// Indexes
BookingSchema.index({ bookingNumber: 1 }, { unique: true });
BookingSchema.index({ user: 1 });
BookingSchema.index({ provider: 1 });
BookingSchema.index({ scheduledDate: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ location: '2dsphere' });
