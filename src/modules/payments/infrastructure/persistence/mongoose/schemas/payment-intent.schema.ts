import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import type { PaymentPurpose, PaymentStatus } from '../../../../domain/entities/payment-intent.entity';

@Schema({ timestamps: true, collection: 'payment_intents' })
export class PaymentIntentDocument extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, default: 'SYP' })
  currency: string;

  @Prop({ required: true, enum: ['wallet_topup', 'order_payment'] })
  purpose: PaymentPurpose;

  @Prop({ required: true, enum: ['pending', 'success', 'failed'], default: 'pending' })
  status: PaymentStatus;

  @Prop({ required: true, unique: true })
  referenceId: string;

  @Prop()
  gatewayUrl?: string;

  @Prop()
  targetId?: string; // Order ID if purpose is order_payment

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const PaymentIntentSchema = SchemaFactory.createForClass(PaymentIntentDocument);
