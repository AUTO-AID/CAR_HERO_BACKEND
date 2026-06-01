import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AiRecommendationLogDocument = AiRecommendationLog & Document;

@Schema({ _id: false })
class InputCriteria {
  @Prop({ required: true })
  serviceCategory: string;

  @Prop({ required: true })
  city: string;

  @Prop({ type: Object, required: true })
  location: { lat: number; lng: number };

  @Prop({ required: true })
  urgencyLevel: string;

  @Prop()
  preferredTime?: Date;

  @Prop()
  vehicleType?: string;
}

@Schema({ _id: false })
class RecommendationResult {
  @Prop({ type: Types.ObjectId, ref: 'Provider', required: true })
  provider: Types.ObjectId;

  @Prop({ required: true })
  score: number;

  @Prop({ required: true })
  distanceKm: number;

  @Prop({ required: true })
  confidence: number;

  @Prop({ type: Object, required: true })
  scoresBreakdown: {
    distance: number;
    rating: number;
    serviceMatch: number;
    workingHours: number;
    emergencySupport: number;
    expectedResponseTime: number;
    completedOrders: number;
    cancellationRate: number;
    cityMatch: number;
    urgencyAlignment: number;
  };

  @Prop({ type: [String], default: [] })
  reasons: string[];

  @Prop({ type: Boolean, default: false })
  isExploration?: boolean;
}

@Schema({
  timestamps: true,
  collection: 'ai_recommendation_logs',
  toJSON: {
    virtuals: true,
    transform: function (doc: any, ret: any) {
      delete ret.__v;
      return ret;
    },
  },
})
export class AiRecommendationLog {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  user?: Types.ObjectId;

  @Prop({ type: InputCriteria, required: true })
  criteria: InputCriteria;

  @Prop({ required: true, default: 0 })
  candidateCount: number;

  @Prop({ type: [RecommendationResult], default: [] })
  recommendations: RecommendationResult[];

  @Prop({ type: Types.ObjectId, ref: 'Provider' })
  chosenProvider?: Types.ObjectId; // Populated later if the user books/orders this provider

  @Prop({ required: true, default: 'success', enum: ['success', 'failed'] })
  status: string;

  @Prop()
  errorMessage?: string;

  @Prop({ required: true, default: 'rule_based' })
  modelType: string;

  @Prop({ required: true, default: 'v1' })
  modelVersion: string;
}

export const AiRecommendationLogSchema = SchemaFactory.createForClass(AiRecommendationLog);

// Indexing optimized for ML training, analytics, and admin dashboard queries
AiRecommendationLogSchema.index({ user: 1, createdAt: -1 });
AiRecommendationLogSchema.index({ 'criteria.serviceCategory': 1, createdAt: -1 });
AiRecommendationLogSchema.index({ 'criteria.city': 1, createdAt: -1 });
AiRecommendationLogSchema.index({ status: 1, createdAt: -1 });
AiRecommendationLogSchema.index({ modelType: 1, modelVersion: 1, createdAt: -1 });
AiRecommendationLogSchema.index({ candidateCount: 1 });
AiRecommendationLogSchema.index({ chosenProvider: 1 }, { sparse: true });
AiRecommendationLogSchema.index({ createdAt: -1 });
