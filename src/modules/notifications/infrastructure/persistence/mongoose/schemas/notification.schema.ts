/**
 * Notification Schema
 * MongoDB schema for in-app notifications
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { NotificationType } from '../../../../../../core/enums/status.enum';

export type NotificationDocument = Notification & Document;

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
export class Notification {
  @Prop({ type: Types.ObjectId, required: true })
  recipientId: Types.ObjectId;

  @Prop({ required: true, enum: ['user', 'provider', 'admin'] })
  recipientType: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop({ type: String, enum: NotificationType, required: true })
  type: NotificationType;

  @Prop({ type: Object, default: {} })
  data: Record<string, any>;

  @Prop()
  campaignId?: string;

  @Prop()
  audience?: string;

  @Prop({ enum: ['scheduled', 'sent', 'failed'], default: 'sent' })
  deliveryStatus: string;

  @Prop()
  scheduledAt?: Date;

  @Prop()
  sentAt?: Date;

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  readAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Indexes
NotificationSchema.index({ recipientId: 1, isRead: 1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ campaignId: 1 });
NotificationSchema.index({ deliveryStatus: 1, scheduledAt: 1 });
