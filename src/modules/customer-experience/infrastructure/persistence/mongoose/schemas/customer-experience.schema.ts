import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

const jsonOptions = {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id?.toString();
    delete ret.__v;
    return ret;
  },
};

@Schema({ timestamps: true, collection: 'user_addresses', toJSON: jsonOptions })
export class UserAddress {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  label: string;

  @Prop({ required: true, trim: true })
  addressLine: string;

  @Prop({ trim: true })
  note?: string;

  @Prop({ type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], required: true } })
  location: { type: 'Point'; coordinates: number[] };

  @Prop({ default: false, index: true })
  isDefault: boolean;
}
export type UserAddressDocument = UserAddress & Document;
export const UserAddressSchema = SchemaFactory.createForClass(UserAddress);
UserAddressSchema.index({ userId: 1, isDefault: 1 });
UserAddressSchema.index({ location: '2dsphere' });

@Schema({ timestamps: true, collection: 'user_payment_methods', toJSON: jsonOptions })
export class UserPaymentMethod {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  // `card` و`wallet` باقيتان للقراءة التاريخية؛ الإنشاء الجديد محصور في
  // `cash` و`cham_cash` عبر الـ DTO.
  @Prop({ required: true, enum: ['cash', 'cham_cash', 'card', 'wallet'] })
  type: string;

  @Prop({ required: true, trim: true })
  displayName: string;

  @Prop()
  last4?: string;

  @Prop()
  brand?: string;

  @Prop({ select: false })
  providerToken?: string;

  @Prop({ default: false, index: true })
  isDefault: boolean;
}
export type UserPaymentMethodDocument = UserPaymentMethod & Document;
export const UserPaymentMethodSchema = SchemaFactory.createForClass(UserPaymentMethod);
UserPaymentMethodSchema.index({ userId: 1, isDefault: 1 });

@Schema({ timestamps: true, collection: 'wash_plans', toJSON: jsonOptions })
export class WashPlan {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Vehicle', required: true, index: true })
  vehicleId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: UserAddress.name })
  addressId?: Types.ObjectId;

  @Prop({ required: true, enum: [1, 2, 4] })
  visitsPerMonth: number;

  @Prop({ required: true, enum: ['external', 'internal', 'full'] })
  washType: string;

  @Prop({ required: true, enum: ['morning', 'noon', 'evening'] })
  preferredTimeSlot: string;

  @Prop({ default: true })
  reminderEnabled: boolean;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ index: true })
  nextBookingAt?: Date;

  @Prop()
  lastBookingAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  lastOrderId?: Types.ObjectId;
}
export type WashPlanDocument = WashPlan & Document;
export const WashPlanSchema = SchemaFactory.createForClass(WashPlan);
WashPlanSchema.index({ userId: 1, vehicleId: 1 });
WashPlanSchema.index({ isActive: 1, nextBookingAt: 1 });

@Schema({ timestamps: true, collection: 'user_devices', toJSON: jsonOptions })
export class UserDevice {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  fcmToken: string;

  @Prop({ required: true, enum: ['ios', 'android', 'web'] })
  platform: string;

  @Prop()
  deviceName?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: () => new Date() })
  lastSeenAt: Date;
}
export type UserDeviceDocument = UserDevice & Document;
export const UserDeviceSchema = SchemaFactory.createForClass(UserDevice);
UserDeviceSchema.index({ userId: 1, isActive: 1 });
