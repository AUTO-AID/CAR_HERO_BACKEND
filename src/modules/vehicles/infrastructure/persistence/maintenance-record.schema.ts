/**
 * Maintenance Record Mongoose Schema
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MaintenanceRecordDocument = MaintenanceRecord & Document;

@Schema({ timestamps: true })
export class MaintenanceRecord {
  @Prop({ type: Types.ObjectId, ref: 'Vehicle', required: true, index: true })
  vehicle: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true, trim: true })
  serviceType: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ default: Date.now })
  date: Date;

  @Prop({ min: 0 })
  mileage?: number;

  @Prop({ min: 0 })
  cost?: number;

  @Prop({ trim: true })
  provider?: string;

  @Prop({ trim: true })
  location?: string;

  @Prop({ trim: true })
  invoiceNumber?: string;

  @Prop({ type: [String], default: [] })
  parts: string[];

  @Prop({ trim: true })
  notes?: string;

  @Prop({ type: [String], default: [] })
  attachments: string[];
}

export const MaintenanceRecordSchema = SchemaFactory.createForClass(MaintenanceRecord);

// Indexes
MaintenanceRecordSchema.index({ vehicle: 1, date: -1 });
MaintenanceRecordSchema.index({ user: 1 });
