import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PendingRegistrationDocument = PendingRegistration & Document;

@Schema({ timestamps: true, collection: 'pending_registrations' })
export class PendingRegistration {
  @Prop({ required: true, unique: true, trim: true })
  phoneNumber: string;

  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({
    type: String,
    enum: ['customer', 'provider', 'admin'],
    default: 'customer',
  })
  accountType: string;

  @Prop({ required: true, default: false })
  isTermsAccepted: boolean;

  @Prop({ type: String, default: null, select: false })
  otpCode: string | null;

  @Prop({ type: Date, default: null, select: false })
  otpExpiresAt: Date | null;

  @Prop({ default: 0, select: false })
  otpAttempts: number;

  @Prop({ type: Date, expires: 600 }) // Auto-delete after 10 minutes (TTL index)
  expiresAt: Date;
}

export const PendingRegistrationSchema =
  SchemaFactory.createForClass(PendingRegistration);
