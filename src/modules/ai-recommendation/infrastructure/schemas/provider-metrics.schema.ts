import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProviderMetricsDocument = ProviderMetrics & Document;

@Schema({ _id: false })
class CityPerformanceDetail {
  @Prop({ default: 0 })
  totalOrders: number;

  @Prop({ default: 0.0 })
  completionRate: number;

  @Prop({ default: 0.0 })
  averageRating: number;
}

const CityPerformanceDetailSchema = SchemaFactory.createForClass(CityPerformanceDetail);

@Schema({ _id: false })
class PeriodicPerformance {
  @Prop({ default: 0 })
  totalOrders: number;

  @Prop({ default: 0.0 })
  completionRate: number;

  @Prop({ default: 0.0 })
  averageRating: number;
}

const PeriodicPerformanceSchema = SchemaFactory.createForClass(PeriodicPerformance);

@Schema({
  timestamps: true,
  collection: 'provider_metrics',
  toJSON: {
    virtuals: true,
    transform: function (doc: any, ret: any) {
      delete ret.__v;
      return ret;
    },
  },
})
export class ProviderMetrics {
  @Prop({ type: Types.ObjectId, ref: 'Provider', required: true, unique: true })
  provider: Types.ObjectId;

  @Prop({ required: true, default: 0 })
  totalOrders: number;

  @Prop({ required: true, default: 0 })
  completedOrders: number;

  @Prop({ required: true, default: 0 })
  cancelledOrders: number;

  @Prop({ required: true, default: 0 })
  failedOrders: number;

  @Prop({ required: true, default: 0.0 })
  completionRate: number;

  @Prop({ required: true, default: 0.0 })
  cancellationRate: number;

  @Prop({ required: true, default: 0.0 })
  averageRating: number;

  @Prop({ required: true, default: 0 })
  totalReviews: number;

  @Prop({ required: true, default: 0.0, description: 'Average response time in minutes' })
  averageResponseTime: number;

  @Prop({ required: true, default: 0.0, description: 'Average arrival time in minutes' })
  averageArrivalTime: number;

  @Prop({ type: Map, of: Number, default: () => new Map() })
  serviceSpecializationScores: Map<string, number>; // e.g. { towing: 0.95, tire: 0.80 }

  @Prop({ type: Map, of: CityPerformanceDetailSchema, default: () => new Map() })
  cityPerformance: Map<string, CityPerformanceDetail>;

  @Prop({ type: PeriodicPerformanceSchema, default: () => ({ totalOrders: 0, completionRate: 0.0, averageRating: 0.0 }) })
  last30DaysPerformance: PeriodicPerformance;

  @Prop({ type: PeriodicPerformanceSchema, default: () => ({ totalOrders: 0, completionRate: 0.0, averageRating: 0.0 }) })
  peakHourPerformance: PeriodicPerformance;
}

export const ProviderMetricsSchema = SchemaFactory.createForClass(ProviderMetrics);

// Indexing for high-performance recommendation sorting
ProviderMetricsSchema.index({ completionRate: -1 });
ProviderMetricsSchema.index({ averageRating: -1 });
ProviderMetricsSchema.index({ averageResponseTime: 1 });
ProviderMetricsSchema.index({ totalOrders: -1 });
