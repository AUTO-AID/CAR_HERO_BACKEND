/**
 * Service Schema
 * MongoDB schema for services offered by providers
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ServiceCategory } from '../../common/enums/status.enum';

export type ServiceDocument = Service & Document;

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
export class Service {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  nameAr: string; // Arabic name

  @Prop()
  description?: string;

  @Prop()
  descriptionAr?: string; // Arabic description

  @Prop({ type: String, enum: ServiceCategory, required: true })
  category: ServiceCategory;

  @Prop()
  icon?: string;

  @Prop()
  image?: string;

  @Prop({ required: true })
  basePrice: number;

  @Prop({ default: 0 })
  discountedPrice: number;

  @Prop({ required: true })
  estimatedDuration: number; // in minutes

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isEmergency: boolean; // For roadside assistance

  @Prop({ default: 0 })
  sortOrder: number;

  // For provider-specific services
  @Prop({ type: Types.ObjectId, ref: 'Provider' })
  provider?: Types.ObjectId;

  // If null, it's a system-wide service
  @Prop({ default: false })
  isSystemService: boolean;

  // Additional options/add-ons for this service
  @Prop({ type: [Object], default: [] })
  options: {
    name: string;
    nameAr: string;
    price: number;
    isDefault?: boolean;
  }[];

  // Metadata
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);

// Indexes
ServiceSchema.index({ category: 1 });
ServiceSchema.index({ provider: 1 });
ServiceSchema.index({ isActive: 1 });
ServiceSchema.index({ sortOrder: 1 });
