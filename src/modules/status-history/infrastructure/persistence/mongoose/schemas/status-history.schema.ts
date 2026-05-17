import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StatusHistoryDocument = StatusHistory & Document;

@Schema({
  timestamps: true,
  collection: 'status_histories',
  toJSON: {
    virtuals: true,
    transform: function (doc: any, ret: any) {
      delete ret.__v;
      return ret;
    },
  },
})
export class StatusHistory {
  @Prop({ required: true, trim: true, default: 'order' })
  entityType: string;

  @Prop({ type: Types.ObjectId, required: true })
  entityId: Types.ObjectId;

  @Prop()
  orderNumber?: string;

  @Prop()
  fromStatus?: string;

  @Prop({ required: true })
  toStatus: string;

  @Prop({ type: Types.ObjectId })
  changedBy?: Types.ObjectId;

  @Prop()
  changedByRole?: string;

  @Prop()
  changedByType?: string;

  @Prop()
  reason?: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const StatusHistorySchema = SchemaFactory.createForClass(StatusHistory);

StatusHistorySchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
StatusHistorySchema.index({ orderNumber: 1, createdAt: -1 });
StatusHistorySchema.index({ changedBy: 1, createdAt: -1 });
StatusHistorySchema.index({ toStatus: 1, createdAt: -1 });
