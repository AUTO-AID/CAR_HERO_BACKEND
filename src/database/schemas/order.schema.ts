/**
 * Order Schema
 * MongoDB schema for service orders
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderStatus, PaymentStatus } from '../../common/enums/status.enum';

export type OrderDocument = Order & Document;

/**
 * GeoJSON Point Schema for location
 */
@Schema({ _id: false })
class GeoLocation {
  @Prop({ type: String, enum: ['Point'], default: 'Point' })
  type: string;

  @Prop({ type: [Number], required: true })
  coordinates: number[]; // [longitude, latitude]
}

/**
 * Timeline Entry Schema
 */
@Schema({ _id: false })
class TimelineEntry {
  @Prop({ type: String, enum: OrderStatus, required: true })
  status: OrderStatus;

  @Prop({ required: true })
  timestamp: Date;

  @Prop()
  note?: string;
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

  @Prop({ type: Types.ObjectId, ref: 'Vehicle' })
  vehicle?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Service', required: true })
  service: Types.ObjectId;

  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  // User's location
  @Prop({ type: GeoLocation, required: true })
  userLocation: GeoLocation;

  @Prop()
  userAddress?: string;

  // Provider's current location (for tracking)
  @Prop({ type: GeoLocation })
  providerLocation?: GeoLocation;

  // Service details at time of order
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

  // Pricing breakdown
  @Prop({ required: true })
  subtotal: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ default: 0 })
  tax: number;

  @Prop({ required: true })
  total: number;

  // Promo code applied
  @Prop()
  promoCode?: string;

  // Payment
  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Prop({ default: 'cash' })
  paymentMethod: string;

  @Prop()
  paymentId?: string;

  // Scheduling
  @Prop()
  scheduledAt?: Date;

  @Prop({ default: false })
  isScheduled: boolean;

  // Timing
  @Prop()
  acceptedAt?: Date;

  @Prop()
  arrivedAt?: Date;

  @Prop()
  startedAt?: Date;

  @Prop()
  completedAt?: Date;

  @Prop()
  cancelledAt?: Date;

  @Prop()
  cancellationReason?: string;

  @Prop({ default: 'user' })
  cancelledBy?: string; // user, provider, admin, system

  // Notes
  @Prop()
  userNotes?: string;

  @Prop()
  providerNotes?: string;

  @Prop()
  adminNotes?: string;

  // Rating (after completion)
  @Prop({ min: 1, max: 5 })
  rating?: number;

  @Prop({ type: Types.ObjectId, ref: 'Review' })
  review?: Types.ObjectId;

  // Status timeline
  @Prop({ type: [TimelineEntry], default: [] })
  timeline: TimelineEntry[];

  // Estimated time of arrival (in minutes)
  @Prop()
  estimatedArrival?: number;

  // Metadata
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Indexes
OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ provider: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ userLocation: '2dsphere' });
OrderSchema.index({ createdAt: -1 });
