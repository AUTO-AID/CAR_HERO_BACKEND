import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OperationalRecommendationDocument = OperationalRecommendation & Document;

@Schema({ _id: false, timestamps: true })
class RecommendationNote {
  @Prop({ type: Types.ObjectId, ref: 'Admin' })
  admin?: Types.ObjectId;

  @Prop()
  adminName?: string;

  @Prop({ required: true })
  text: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

@Schema({
  timestamps: true,
  collection: 'operational_recommendations',
  toJSON: {
    virtuals: true,
    transform: function (doc: any, ret: any) {
      delete ret.__v;
      return ret;
    },
  },
})
export class OperationalRecommendation {
  @Prop({ required: true, unique: true, index: true })
  dedupeKey: string;

  @Prop({ required: true, enum: ['provider_recruitment', 'provider_risk', 'coverage_gap', 'demand_spike'] })
  type: string;

  @Prop({ required: true, enum: ['low', 'medium', 'high', 'critical'], index: true })
  priority: string;

  @Prop({ required: true, enum: ['new', 'acknowledged', 'in_progress', 'resolved', 'dismissed'], default: 'new', index: true })
  status: string;

  @Prop()
  city?: string;

  @Prop()
  governorate?: string;

  @Prop({ type: Types.ObjectId, ref: 'Service' })
  service?: Types.ObjectId;

  @Prop()
  serviceName?: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  summary: string;

  @Prop()
  reason?: string;

  @Prop({ type: [String], default: [] })
  reasons: string[];

  @Prop({ default: 0 })
  recommendedProviders: number;

  @Prop({ type: Object, default: {} })
  evidence: Record<string, any>;

  @Prop({ default: Date.now, index: true })
  detectedAt: Date;

  @Prop()
  lastSeenAt?: Date;

  @Prop()
  acknowledgedAt?: Date;

  @Prop()
  resolvedAt?: Date;

  @Prop()
  dismissedAt?: Date;

  @Prop({ index: true })
  dueAt?: Date;

  @Prop({ enum: ['on_track', 'due_soon', 'overdue'], default: 'on_track', index: true })
  slaStatus?: string;

  @Prop()
  expiresAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'Admin' })
  assignedToAdmin?: Types.ObjectId;

  @Prop()
  assignedAt?: Date;

  @Prop()
  resolutionNote?: string;

  @Prop({ type: Types.ObjectId, ref: 'Admin' })
  resolvedBy?: Types.ObjectId;

  @Prop()
  notificationSentAt?: Date;

  @Prop({ type: [RecommendationNote], default: [] })
  notes: RecommendationNote[];

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const OperationalRecommendationSchema = SchemaFactory.createForClass(OperationalRecommendation);

OperationalRecommendationSchema.index({ status: 1, priority: 1, detectedAt: -1 });
OperationalRecommendationSchema.index({ city: 1, service: 1, status: 1 });
OperationalRecommendationSchema.index({ slaStatus: 1, dueAt: 1, status: 1 });
