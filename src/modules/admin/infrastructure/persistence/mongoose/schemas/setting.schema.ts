/**
 * Setting Schema
 * MongoDB schema for platform-wide settings
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SettingDocument = Setting & Document;

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
export class Setting {
  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ type: Object, required: true })
  value: any;

  @Prop({ default: false })
  maintenanceMode: boolean;

  @Prop()
  maintenanceMessage?: string;

  @Prop()
  maintenanceMessageAr?: string;

  @Prop()
  description?: string;

  @Prop({ default: 'general' })
  group: string;

  @Prop({ default: true })
  isPublic: boolean; // If true, can be accessed by users
}

export const SettingSchema = SchemaFactory.createForClass(Setting);

SettingSchema.index({ group: 1 });
