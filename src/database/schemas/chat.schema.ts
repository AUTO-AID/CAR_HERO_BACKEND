/**
 * Chat & Message Schemas
 * MongoDB schemas for chat conversations and messages
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  LOCATION = 'location',
  SYSTEM = 'system',
}

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
  @Prop({ type: [Types.ObjectId], required: true })
  participants: Types.ObjectId[]; // Array of user IDs (User, Provider, Admin)

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  orderId?: Types.ObjectId;

  @Prop()
  lastMessage?: string;

  @Prop()
  lastMessageAt?: Date;

  @Prop({ type: Types.ObjectId })
  lastMessageBy?: Types.ObjectId;

  // Unread counts per participant: { userId: count }
  @Prop({ type: Map, of: Number, default: {} })
  unreadCounts: Map<string, number>;

  @Prop({ default: true })
  isActive: boolean;

  // Metadata
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);

// Indexes
ChatSchema.index({ participants: 1 });
ChatSchema.index({ orderId: 1 });
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
  chatId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  senderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  receiverId: Types.ObjectId;

  @Prop({ required: true })
  message: string;

  @Prop({ type: String, enum: MessageType, default: MessageType.TEXT })
  type: MessageType;

  @Prop()
  fileUrl?: string;

  @Prop({ type: Object })
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  readAt?: Date;

  // Metadata
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Indexes
MessageSchema.index({ chatId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1 });
MessageSchema.index({ receiverId: 1 });
