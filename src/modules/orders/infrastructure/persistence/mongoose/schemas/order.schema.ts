/**
 * Order Schema
 * MongoDB schema for service orders
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderStatus, PaymentStatus, PaymentMethod } from '../../../../../../core/enums/status.enum';

export type OrderDocument = Order & Document;

@Schema({ _id: false })
class GeoLocation {
  @Prop({ type: String, enum: ['Point'], default: 'Point' })
  type: string;

  @Prop({ type: [Number], required: true })
  coordinates: number[]; // [longitude, latitude]
}

@Schema({ _id: false })
class ProviderLocationPoint {
  @Prop({ type: [Number], required: true })
  coordinates: number[]; // [longitude, latitude]

  @Prop({ required: true })
  recordedAt: Date;

  @Prop()
  accuracy?: number;

  @Prop()
  heading?: number;

  @Prop()
  speed?: number;
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
export class Order {
  @Prop({ required: true, unique: true })
  orderNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Provider' })
  provider?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Service', required: true })
  service: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Vehicle' })
  vehicle?: Types.ObjectId;

  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ default: 0 })
  discountAmount: number;

  @Prop({ required: true })
  payableAmount: number;

  // Location where service is needed
  @Prop({ type: GeoLocation, required: true })
  location: GeoLocation;

  // Latest provider position and a bounded route trail for live tracking.
  @Prop({ type: GeoLocation })
  providerLocation?: GeoLocation;

  @Prop()
  providerLocationUpdatedAt?: Date;

  @Prop({ type: [ProviderLocationPoint], default: [] })
  providerLocationHistory: ProviderLocationPoint[];

  @Prop()
  address?: string;

  // Scheduling
  @Prop({ default: false })
  isScheduled: boolean;

  @Prop()
  scheduledAt?: Date;

  // Payment
  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Prop({ type: String, enum: PaymentMethod, default: PaymentMethod.CASH })
  paymentMethod: PaymentMethod;

  @Prop()
  paymentId?: string; // Reference to external payment gateway

  // Details
  @Prop()
  userNotes?: string;

  @Prop()
  providerNotes?: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  // Time tracking
  @Prop()
  acceptedAt?: Date;

  @Prop()
  startedAt?: Date;

  @Prop()
  completedAt?: Date;

  @Prop()
  cancelledAt?: Date;

  @Prop()
  cancellationReason?: string;

  @Prop({ type: String, enum: ['user', 'provider', 'admin', 'system'] })
  cancelledBy?: string;

  // Rating reference
  @Prop({ type: Types.ObjectId, ref: 'Review' })
  review?: Types.ObjectId;

  @Prop({ default: 0 })
  rating?: number;

  // Metadata
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Indexes
OrderSchema.index({ user: 1 });
OrderSchema.index({ provider: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ location: '2dsphere' });
OrderSchema.index({ providerLocation: '2dsphere' });
OrderSchema.index({ createdAt: -1 });
