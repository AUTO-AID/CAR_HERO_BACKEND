import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

class CoordinatesDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  label: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
  addressLine: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  note?: string;

  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates: CoordinatesDto;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  addressLine?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  note?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates?: CoordinatesDto;
}

export class CreatePaymentMethodDto {
  @IsEnum(['cash', 'card', 'wallet'])
  type: 'cash' | 'card' | 'wallet';

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  displayName: string;

  @IsOptional()
  @IsString()
  @MaxLength(4)
  last4?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  providerToken?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdatePaymentMethodDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  providerToken?: string;
}

export class ApplyOfferDto {
  @IsOptional()
  @IsMongoId()
  orderId?: string;
}

export class CreateWashPlanDto {
  @IsMongoId()
  vehicleId: string;

  @IsOptional()
  @IsMongoId()
  addressId?: string;

  @IsIn([1, 2, 4])
  visitsPerMonth: number;

  @IsEnum(['external', 'internal', 'full'])
  washType: 'external' | 'internal' | 'full';

  @IsEnum(['morning', 'noon', 'evening'])
  preferredTimeSlot: 'morning' | 'noon' | 'evening';

  @IsOptional()
  @IsBoolean()
  reminderEnabled?: boolean;
}

export class UpdateWashPlanDto {
  @IsOptional()
  @IsMongoId()
  addressId?: string;

  @IsOptional()
  @IsIn([1, 2, 4])
  visitsPerMonth?: number;

  @IsOptional()
  @IsEnum(['external', 'internal', 'full'])
  washType?: 'external' | 'internal' | 'full';

  @IsOptional()
  @IsEnum(['morning', 'noon', 'evening'])
  preferredTimeSlot?: 'morning' | 'noon' | 'evening';

  @IsOptional()
  @IsBoolean()
  reminderEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class RegisterDeviceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  fcmToken: string;

  @IsEnum(['ios', 'android', 'web'])
  platform: 'ios' | 'android' | 'web';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  deviceName?: string;
}

export class CreateOfferDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  description?: string;

  @IsEnum(['percentage', 'fixed', 'points_multiplier'])
  type: 'percentage' | 'fixed' | 'points_multiplier';

  @IsNumber()
  @Min(0)
  value: number;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateOfferDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
