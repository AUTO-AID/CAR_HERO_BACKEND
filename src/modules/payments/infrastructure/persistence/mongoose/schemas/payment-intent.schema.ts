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

  // `type: String` صريح: النوعان اتّحادان نصّيان (`'wallet_topup' | ...`)،
  // و TypeScript يُصدِر لهما `design:type = Object` فلا يستطيع `@Prop` استنتاج
  // النوع ويرمي عند بناء المخطّط. والبناء يقع عند **استيراد** الملف
  // (`SchemaFactory.createForClass` في آخره)، فكان استيراد `PaymentsModule`
  // يُسقط إقلاع الخادم كلّه — لا وحدة المدفوعات وحدها.
  @Prop({ type: String, required: true, enum: ['wallet_topup', 'order_payment'] })
  purpose: PaymentPurpose;

  @Prop({ type: String, required: true, enum: ['pending', 'success', 'failed'], default: 'pending' })
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
