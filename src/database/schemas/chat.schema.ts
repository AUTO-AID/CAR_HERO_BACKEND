/**
 * Chat & Message Schemas
 * MongoDB schemas for chat conversations and messages
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatDocument = Chat & Document;
export type MessageDocument = Message & Document;

/**
 * Chat/Conversation Schema
 */
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
export class Chat {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  user?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Provider' })
  provider?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  order?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Booking' })
  booking?: Types.ObjectId;

  // Last message for preview
  @Prop()
  lastMessage?: string;

  @Prop()
  lastMessageAt?: Date;

  @Prop({ default: 'user' })
  lastMessageBy?: string; // user, provider

  // Unread counts
  @Prop({ default: 0 })
  userUnreadCount: number;

  @Prop({ default: 0 })
  providerUnreadCount: number;

  @Prop({ default: true })
  isActive: boolean;

  // Metadata
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);

// Indexes
ChatSchema.index({ user: 1, provider: 1 });
ChatSchema.index({ order: 1 });
ChatSchema.index({ lastMessageAt: -1 });

/**
 * Message Schema
 */
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
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Chat', required: true })
  chat: Types.ObjectId;

  @Prop({ required: true })
  senderType: string; // user, provider, system

  @Prop({ type: Types.ObjectId, required: true })
  senderId: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ default: 'text' })
  type: string; // text, image, location, system

  // For image/file messages
  @Prop()
  mediaUrl?: string;

  @Prop()
  mediaType?: string;

  // For location messages
  @Prop({ type: Object })
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  readAt?: Date;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  deletedAt?: Date;

  // Metadata
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Indexes
MessageSchema.index({ chat: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1 });
