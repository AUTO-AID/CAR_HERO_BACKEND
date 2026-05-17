import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({
  timestamps: true,
  collection: 'audit_logs',
  toJSON: {
    virtuals: true,
    transform: function (doc: any, ret: any) {
      delete ret.__v;
      return ret;
    },
  },
})
export class AuditLog {
  @Prop({ type: Types.ObjectId, ref: 'Admin' })
  admin?: Types.ObjectId;

  @Prop()
  adminEmail?: string;

  @Prop()
  adminName?: string;

  @Prop({ required: true, trim: true })
  action: string;

  @Prop({ required: true, trim: true })
  entityType: string;

  @Prop({ type: Types.ObjectId })
  entityId?: Types.ObjectId;

  @Prop()
  summary?: string;

  @Prop({ type: Object, default: {} })
  before: Record<string, any>;

  @Prop({ type: Object, default: {} })
  after: Record<string, any>;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ admin: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 });
