import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type LogoutDocument = Logout & Document;

@Schema({ timestamps: true })
export class Logout {
  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
  })
  userId: Types.ObjectId;

  @Prop({ required: true })
  refreshTokenHash: string;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  @Prop({ default: true })
  success: boolean;

  @Prop({
    enum: ['manual', 'expired', 'forced', 'security'],
    default: 'manual',
  })
  reason: string;
}

export const LogoutSchema = SchemaFactory.createForClass(Logout);
