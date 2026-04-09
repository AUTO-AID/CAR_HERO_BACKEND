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
  owner: Types.ObjectId;

  @Prop({ required: true })
  brand: string;

  @Prop({ required: true })
  model: string;

  @Prop({ required: true })
  year: number;

  @Prop()
  color?: string;

  @Prop({ required: true })
  plateNumber: string;

  @Prop()
  plateType?: string;

  @Prop()
  vin?: string; // Vehicle Identification Number

  @Prop()
  fuelType?: string; // بنزين، ديزل، كهرباء، هايبرد

  @Prop()
  engineType?: string; // Petrol, Diesel, Electric, Hybrid

  @Prop()
  transmission?: string; // عادي، أوتوماتيك

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDefault: boolean;

  // Insurance details
  @Prop()
  insuranceCompany?: string;

  @Prop()
  insuranceNumber?: string;

  @Prop()
  insuranceExpiry?: Date;

  // Registration details
  @Prop()
  registrationNumber?: string;

  @Prop()
  registrationExpiry?: Date;

  // Metadata
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle);

// Indexes
VehicleSchema.index({ owner: 1 });
VehicleSchema.index({ plateNumber: 1 });
VehicleSchema.index({ createdAt: -1 });
