/**
 * Notification Schema
 * MongoDB schema for push notifications
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { NotificationType } from '../../common/enums/status.enum';

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

  @Prop({ required: true })
  recipientType: string; // user, provider

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop({ type: String, enum: NotificationType, default: NotificationType.SYSTEM })
  type: NotificationType;

  // Deep link or action
  @Prop()
  action?: string;

  @Prop({ type: Object })
  data?: Record<string, any>;

  // Reference to related entity
  @Prop()
  referenceType?: string; // order, booking, chat, promotion

  @Prop({ type: Types.ObjectId })
  referenceId?: Types.ObjectId;

  // Image/icon
  @Prop()
  imageUrl?: string;

  // Read status
  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  readAt?: Date;

  // Push notification sent
  @Prop({ default: false })
  isPushSent: boolean;

  @Prop()
  pushSentAt?: Date;

  @Prop()
  pushError?: string;

  // Expiry
  @Prop()
  expiresAt?: Date;

  // Metadata
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Indexes
NotificationSchema.index({ recipientId: 1, recipientType: 1, createdAt: -1 });
NotificationSchema.index({ isRead: 1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
