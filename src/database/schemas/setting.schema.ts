/**
 * Setting Schema
 * MongoDB schema for global application settings
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SettingDocument = Setting & Document;

@Schema({
  timestamps: true,
  toJSON: {
    transform: function (doc: any, ret: any) {
      delete ret.__v;
      return ret;
    },
  },
})
export class Setting {
  @Prop({ required: true, unique: true, default: 'app_config' })
  key: string;

  @Prop({ default: false })
  maintenanceMode: boolean;

  @Prop()
  maintenanceMessage?: string;

  @Prop()
  maintenanceMessageAr?: string;

  @Prop({ type: Object, default: {} })
  features: {
    chatEnabled: boolean;
    aiAssistantEnabled: boolean;
    providerRegistrationOpen: boolean;
  };

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const SettingSchema = SchemaFactory.createForClass(Setting);

// Indexes
SettingSchema.index({ key: 1 }, { unique: true });
