/**
 * Vehicle Reminder Mongoose Schema
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ReminderType, ReminderFrequency } from '../../domain/entities/vehicle-reminder.entity';

export type VehicleReminderDocument = VehicleReminder & Document;

@Schema({ timestamps: true })
export class VehicleReminder {
  @Prop({ type: Types.ObjectId, ref: 'Vehicle', required: true, index: true })
  vehicle: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: String, enum: ReminderType, required: true })
  type: ReminderType;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description?: string;

  @Prop()
  reminderDate?: Date;

  @Prop({ min: 0 })
  mileageThreshold?: number;

  @Prop({ min: 0 })
  currentMileage?: number;

  @Prop({ type: String, enum: ReminderFrequency })
  frequency?: ReminderFrequency;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isRecurring: boolean;

  @Prop()
  lastTriggeredAt?: Date;

  @Prop({ trim: true })
  notes?: string;
}

export const VehicleReminderSchema = SchemaFactory.createForClass(VehicleReminder);

// Indexes
VehicleReminderSchema.index({ vehicle: 1, isActive: 1, reminderDate: -1 });
VehicleReminderSchema.index({ user: 1 });
VehicleReminderSchema.index({ reminderDate: 1, isActive: 1 });
