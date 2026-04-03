/**
 * Admin Schema
 * MongoDB schema for admin users
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '../../common/enums/roles.enum';

export type AdminDocument = Admin & Document;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc: any, ret: any) {
      delete ret.password;
      delete ret.__v;
      return ret;
    },
  },
})
export class Admin {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  avatar?: string;

  @Prop({ type: String, enum: Role, default: Role.ADMIN })
  role: Role;

  @Prop({ default: true })
  isActive: boolean;

  // Permissions
  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  lastLoginIp?: string;

  // Refresh token
  @Prop()
  refreshToken?: string;

  // Metadata
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);

// Indexes
AdminSchema.index({ email: 1 }, { unique: true });
