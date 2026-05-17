/**
 * Service Schema
 * System and provider service catalog used by orders.
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ServiceCategory } from '../../../../../../core/enums/status.enum';

export type ServiceDocument = Service & Document;

@Schema({
  timestamps: true,
  collection: 'services',
  toJSON: {
    virtuals: true,
    transform: function (doc: any, ret: any) {
      ret.id = ret._id?.toString();
      delete ret.__v;
      return ret;
    },
  },
})
export class Service {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  nameAr: string;

  @Prop()
  description?: string;

  @Prop()
  descriptionAr?: string;

  @Prop({ type: String, enum: ServiceCategory, required: true, index: true })
  category: ServiceCategory;

  @Prop({ required: true, min: 0 })
  basePrice: number;

  @Prop({ default: 0, min: 0 })
  discountedPrice: number;

  @Prop({ required: true, min: 1 })
  estimatedDuration: number;

  @Prop()
  icon?: string;

  @Prop()
  image?: string;

  @Prop({ default: false, index: true })
  isEmergency: boolean;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ default: true, index: true })
  isSystemService: boolean;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ type: Types.ObjectId, ref: 'Provider' })
  provider?: Types.ObjectId;

  @Prop({
    type: [
      {
        name: { type: String, required: true },
        nameAr: { type: String },
        price: { type: Number, default: 0 },
        isRequired: { type: Boolean, default: false },
        metadata: { type: Object, default: {} },
      },
    ],
    default: [],
  })
  options: Array<Record<string, any>>;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);

ServiceSchema.index({ name: 'text', nameAr: 'text', description: 'text', descriptionAr: 'text' });
ServiceSchema.index({ category: 1, isActive: 1, sortOrder: 1 });
ServiceSchema.index({ isSystemService: 1, isActive: 1 });
ServiceSchema.index({ provider: 1, isActive: 1 });
