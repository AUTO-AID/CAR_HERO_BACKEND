/**
 * Chat Schema
 * MongoDB schema for messaging between users and providers
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatDocument = Chat & Document;

@Schema({ _id: false })
class Message {
  @Prop({ type: Types.ObjectId, required: true })
  senderId: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ type: String, enum: ['text', 'image', 'location', 'voice'], default: 'text' })
  type: string;

  @Prop({ type: Date, default: Date.now })
  sentAt: Date;

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  attachmentUrl?: string;
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
}

export const ChatSchema = SchemaFactory.createForClass(Chat);

ChatSchema.index({ orderId: 1 });
ChatSchema.index({ participants: 1 });
ChatSchema.index({ lastMessageAt: -1 });
