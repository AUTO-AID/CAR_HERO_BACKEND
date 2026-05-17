/**
 * Admin Schema
 * MongoDB schema for platform administrators
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '../../../../../../core/enums/roles.enum';

export type AdminDocument = Admin & Document;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc: any, ret: any) {
      delete ret.password;
      delete ret.refreshToken;
      delete ret.__v;
      return ret;
    },
  },
})
export class Admin {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ type: String, enum: Role, default: Role.ADMIN })
  role: Role;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  avatar?: string;

  @Prop()
  lastLoginIp?: string;

  @Prop({ select: false })
  refreshToken?: string;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);

AdminSchema.index({ isActive: 1 });
