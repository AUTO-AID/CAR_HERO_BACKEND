/**
 * Merged User Schema
 * Combined features from platform and remote auth repository
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from '../../common/enums/roles.enum';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  collection: 'users',
  toJSON: {
    virtuals: true,
    transform: function (doc: any, ret: any) {
      delete ret.password;
      delete ret.otpCode;
      delete ret.otpExpiresAt;
      delete ret.otpAttempts;
      delete ret.refreshToken;
      delete ret.__v;
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({
    required: true,
    unique: true,
    match: [/^\+963\d{9}$/, 'Phone number must start with +963 followed by 9 digits'],
  })
  phoneNumber: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ type: String, default: null })
  profileImage: string | null;

  @Prop({
    type: String,
    enum: ['customer', 'provider', 'admin'],
    default: 'customer',
  })
  accountType: string;

  @Prop({ type: String, enum: Role, default: Role.USER })
  role: Role;

  @Prop({ default: 0, min: 0 })
  pointsBalance: number;

  @Prop({ default: 1, min: 1 })
  loyaltyLevel: number;

  @Prop({ default: false })
  isPremium: boolean;

  @Prop({ type: Date, default: null })
  premiumExpiresAt: Date | null;

  @Prop({
    type: {
      language: { type: String, default: 'ar', enum: ['ar', 'en'] },
      notifications: {
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
        email: { type: Boolean, default: false },
      },
    },
    default: () => ({
      language: 'ar',
      notifications: { push: true, sms: true, email: false },
    }),
  })
  preferences: {
    language: string;
    notifications: {
      push: boolean;
      sms: boolean;
      email: boolean;
    };
  };

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isTermsAccepted: boolean;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ type: Date, default: null })
  lastLoginAt: Date | null;

  @Prop({ type: String, default: null, select: false })
  otpCode: string | null;

  @Prop({ type: Date, default: null, select: false })
  otpExpiresAt: Date | null;

  @Prop({ default: 0, select: false })
  otpAttempts: number;

  @Prop({ type: String, default: null, select: false })
  refreshToken: string | null;

  @Prop()
  fcmToken?: string;

  // Reference to user's vehicles (Existing project feature)
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Vehicle' }] })
  vehicles: Types.ObjectId[];

  // Reference to active subscription (Existing project feature)
  @Prop({ type: Types.ObjectId, ref: 'Subscription' })
  activeSubscription?: Types.ObjectId;

  // Wallet balance (Existing project feature)
  @Prop({ default: 0 })
  walletBalance: number;

  // Loyalty points (Existing project feature - synced with pointsBalance if needed)
  @Prop({ default: 0 })
  loyaltyPoints: number;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ phoneNumber: 1 }, { unique: true });
UserSchema.index({ accountType: 1 });
UserSchema.index({ isPremium: 1, premiumExpiresAt: 1 });
UserSchema.index({ isActive: 1, isVerified: 1 });
UserSchema.index({ createdAt: -1 });
