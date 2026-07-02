import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OperationalAlertDocument = OperationalAlert & Document;

@Schema({
  timestamps: true,
  collection: 'operational_alerts',
  toJSON: {
    virtuals: true,
    transform: function (doc: any, ret: any) {
      delete ret.__v;
      return ret;
    },
  },
})
export class OperationalAlert {
  @Prop({ required: true, unique: true, index: true })
  dedupeKey: string;

  @Prop({ required: true, enum: ['pressure_critical', 'provider_overloaded', 'provider_risky', 'coverage_gap', 'recommendation_overdue', 'daily_brief'], index: true })
  type: string;

  @Prop({ required: true, enum: ['info', 'warning', 'high', 'critical'], index: true })
  severity: string;

  @Prop({ required: true, enum: ['unread', 'read', 'resolved'], default: 'unread', index: true })
  status: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop()
  city?: string;

  @Prop()
  governorate?: string;

  @Prop({ type: Types.ObjectId, ref: 'Service' })
  service?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Provider' })
  provider?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'OperationalRecommendation' })
  recommendation?: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  evidence: Record<string, any>;

  @Prop({ default: Date.now, index: true })
  detectedAt: Date;

  @Prop()
  lastSeenAt?: Date;

  @Prop()
  readAt?: Date;

  @Prop()
  resolvedAt?: Date;

  @Prop()
  notificationSentAt?: Date;
}

export const OperationalAlertSchema = SchemaFactory.createForClass(OperationalAlert);

OperationalAlertSchema.index({ status: 1, severity: 1, detectedAt: -1 });
OperationalAlertSchema.index({ city: 1, service: 1, status: 1 });
