/**
 * Chat Schema
 * MongoDB schema for messaging between users and providers
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatDocument = Chat & Document;

export type MessageDocument = Message & Document;

@Schema({ timestamps: true, collection: 'messages' })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Chat', required: true })
  chatId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  senderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  receiverId: Types.ObjectId;

  @Prop({ required: true })
  message: string;

  @Prop({ type: String, enum: ['text', 'image', 'location', 'voice'], default: 'text' })
  type: string;

  @Prop({ type: Date, default: Date.now })
  sentAt: Date;

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  fileUrl?: string;

  @Prop({ type: Object })
  location?: Record<string, any>;

  @Prop()
  readAt?: Date;
}

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
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId }], required: true })
  participants: Types.ObjectId[];

  @Prop({ type: [Message], default: [] })
  messages: Message[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastMessageAt?: Date;

  @Prop()
  lastMessage?: string;

  @Prop({ type: Types.ObjectId })
  lastMessageBy?: Types.ObjectId;

  @Prop({ type: Map, of: Number, default: {} })
  unreadCounts: Map<string, number>;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
export const MessageSchema = SchemaFactory.createForClass(Message);

ChatSchema.index({ orderId: 1 });
ChatSchema.index({ participants: 1 });
ChatSchema.index({ lastMessageAt: -1 });
