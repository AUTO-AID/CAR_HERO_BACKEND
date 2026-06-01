/**
 * Provider Schema
 * MongoDB schema for service providers (workshops & technicians)
 * Includes GeoJSON location for 2dsphere queries
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from '../../../../../../core/enums/roles.enum';
import { ProviderStatus, ServiceCategory, RegistrationStatus } from '../../../../../../core/enums/status.enum';

export type ProviderDocument = Provider & Document;

/**
 * GeoJSON Point Schema for location
 */
@Schema({ _id: false })
class GeoLocation {
  @Prop({ type: String, enum: ['Point'], default: 'Point' })
  type: string;

  @Prop({ type: [Number], required: true })
  coordinates: number[]; // [longitude, latitude]
}

/**
 * Working Hours Schema
 */
@Schema({ _id: false })
class WorkingHours {
  @Prop({ required: true, enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] })
  day: string;

  @Prop({ required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ })
  open: string;

  @Prop({ required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ })
  close: string;

  @Prop({ default: false })
  isClosed: boolean;
}

/**
 * Bank Account Info Schema
 */
@Schema({ _id: false })
class BankAccount {
  @Prop()
  bankName?: string;

  @Prop()
  accountNumber?: string;

  @Prop()
  iban?: string;

  @Prop()
  accountHolderName?: string;
}

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc: any, ret: any) {
      delete ret.otp;
      delete ret.otpExpiry;
      delete ret.refreshToken;
      delete ret.__v;
      return ret;
    },
  },
})
export class Provider {
  @Prop({ required: true, unique: true })
  phone: string;

  @Prop()
  email?: string;

  @Prop()
  website?: string;

  @Prop()
  facebookUrl?: string;

  @Prop({ required: true })
  businessName: string;

  @Prop()
  ownerName?: string;

  @Prop()
  description?: string;

  @Prop()
  businessType?: string;

  @Prop()
  category?: string;

  @Prop()
  slug?: string;

  @Prop()
  plusCode?: string;

  @Prop()
  googleId?: string;

  @Prop()
  logo?: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: String, enum: Role, default: Role.PROVIDER })
  role: Role;

  @Prop({ type: String, enum: ProviderStatus, default: ProviderStatus.OFFLINE })
  status: ProviderStatus;

  @Prop({ type: String, enum: ['active', 'suspended', 'pending'], default: 'pending' })
  accountStatus: string;

  @Prop()
  accountType?: string;

  @Prop({ type: String, enum: RegistrationStatus, default: RegistrationStatus.PENDING })
  registrationStatus: RegistrationStatus;

  @Prop()
  rejectionReason?: string;

  @Prop({ default: false })
  isApproved: boolean;

  @Prop({ default: true })
  isActive: boolean;

  // GeoJSON location for 2dsphere queries
  @Prop({ type: GeoLocation, required: true })
  location: GeoLocation;

  // Address details
  @Prop()
  address?: string;

  @Prop()
  city?: string;

  @Prop()
  governorate?: string;

  @Prop()
  state?: string;

  @Prop()
  country?: string;

  @Prop()
  postalCode?: string;

  @Prop({ type: [String], default: [] })
  coverageAreas: string[];

  // Service categories provided
  @Prop({ type: [String], enum: ServiceCategory, default: [] })
  serviceCategories: ServiceCategory[];

  // Services offered (reference to Service documents)
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Service' }] })
  services: Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  requestedServices: string[];

  @Prop({ type: [Object], default: [] })
  services_list: Record<string, any>[];

  @Prop({ type: Object, default: {} })
  servicePrices: Record<string, any>;

  @Prop({ type: Object, default: {} })
  serviceAvailability: Record<string, boolean>;

  @Prop({ default: false })
  emergency247: boolean;

  @Prop({ default: false })
  is_emergency: boolean;

  @Prop({ default: 0 })
  serviceRadiusKm: number;

  @Prop({ type: [String], default: [] })
  paymentMethods: string[];

  @Prop({ type: [String], default: [] })
  facilities: string[];

  @Prop({ default: 0 })
  experienceYears: number;

  @Prop({ default: 0 })
  techCount: number;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: false })
  isPhoneVerified: boolean;

  // Working hours
  @Prop({ type: [WorkingHours], default: [] })
  workingHours: WorkingHours[];

  // Ratings and reviews summary
  @Prop({ default: 0 })
  averageRating: number;

  @Prop({ default: 0 })
  totalReviews: number;

  @Prop({ default: 0 })
  totalOrders: number;

  // Authentication
  @Prop()
  otp?: string;

  @Prop()
  otpExpiry?: Date;

  @Prop()
  refreshToken?: string;

  @Prop()
  fcmToken?: string;

  // Documents for verification
  @Prop({ type: [String], default: [] })
  documents: string[];

  @Prop({ type: [Object], default: [] })
  shopPhotos: Record<string, any>[];

  // Bank account for payments
  @Prop({ type: BankAccount })
  bankAccount?: BankAccount;

  // Commission rate (percentage)
  @Prop({ default: 10 })
  commissionRate: number;

  @Prop()
  lastOnlineAt?: Date;
}

export const ProviderSchema = SchemaFactory.createForClass(Provider);

// Create 2dsphere index for geospatial queries
ProviderSchema.index({ location: '2dsphere' });

// Other indexes
ProviderSchema.index({ status: 1 });
ProviderSchema.index({ serviceCategories: 1 });
ProviderSchema.index({ isActive: 1, isApproved: 1 });
ProviderSchema.index({ averageRating: -1 });
ProviderSchema.index({ createdAt: -1 });
ProviderSchema.index({ governorate: 1 });
ProviderSchema.index({ city: 1 });
ProviderSchema.index({ accountType: 1 });
