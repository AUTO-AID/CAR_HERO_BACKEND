/**
 * Vehicle Schema
 * MongoDB schema for user vehicles
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VehicleDocument = Vehicle & Document;

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
export class Vehicle {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  make: string; // e.g., Toyota

  @Prop({ required: true })
  model: string; // e.g., Camry

  @Prop({ required: true })
  year: number;

  @Prop({ required: true })
  plateNumber: string;

  @Prop()
  color?: string;

  @Prop()
  vin?: string; // Vehicle Identification Number

  @Prop()
  image?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDefault: boolean;

  // Metadata
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle);

// Indexes
VehicleSchema.index({ user: 1 });
VehicleSchema.index({ plateNumber: 1 });
