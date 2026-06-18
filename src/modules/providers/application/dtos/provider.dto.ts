/**
 * Provider DTOs
 * Data Transfer Objects for provider management
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEmail,
  IsBoolean,
  IsNumber,
  IsArray,
  IsEnum,
  IsObject,
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  MaxLength,
  Matches,
  MinLength,
  Min,
  Max,
  ValidateNested,
  IsMongoId,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ProviderStatus, ServiceCategory, RegistrationStatus } from '../../../../core/enums/status.enum';

const toBoolean = ({ value }: { value: any }) => {
  if (value === undefined || value === null || value === '') return undefined;
  return value === true || value === 'true';
};

export class ProviderWorkingHourDto {
  @IsString()
  day: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  open: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  close: string;

  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;
}

export class CreateProviderDto {
  @ApiProperty()
  @IsString()
  phone: string;

  @ApiProperty()
  @IsString()
  businessName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  facebookUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  plusCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  googleId?: string;

  @ApiPropertyOptional({ enum: ['active', 'suspended', 'pending'] })
  @IsOptional()
  @IsString()
  accountStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  governorate?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  coverageAreas?: string[];

  @ApiProperty({ example: 46.6753 })
  @Type(() => Number)
  @IsNumber()
  longitude: number;

  @ApiProperty({ example: 24.7136 })
  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @ApiPropertyOptional({ enum: ServiceCategory, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(ServiceCategory, { each: true })
  serviceCategories?: ServiceCategory[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  services?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  requestedServices?: string[];

  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  @IsArray()
  services_list?: Record<string, any>[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  servicePrices?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  emergency247?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_emergency?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  serviceRadiusKm?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  paymentMethods?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  facilities?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  experienceYears?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  techCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPhoneVerified?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  averageRating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalReviews?: number;

  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  @IsArray()
  shopPhotos?: Record<string, any>[];

  @ApiPropertyOptional({ type: [ProviderWorkingHourDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProviderWorkingHourDto)
  workingHours?: ProviderWorkingHourDto[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isApproved?: boolean;
}

/**
 * Update Provider DTO
 */
export class UpdateProviderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  businessName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  ownerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  images?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsEnum(ServiceCategory, { each: true })
  serviceCategories?: ServiceCategory[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  workingHours?: {
    day: string;
    open: string;
    close: string;
    isClosed?: boolean;
  }[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  services?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  documents?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  bankAccount?: Record<string, any>;
}

export class UpdateProviderProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  businessName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  ownerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;
}

/**
 * Provider Query DTO
 */
export class ProviderQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isApproved?: boolean;

  @ApiPropertyOptional({ enum: RegistrationStatus })
  @IsOptional()
  @IsEnum(RegistrationStatus)
  registrationStatus?: RegistrationStatus;

  @ApiPropertyOptional({ enum: ProviderStatus })
  @IsOptional()
  @IsEnum(ProviderStatus)
  status?: ProviderStatus;

  @ApiPropertyOptional({ enum: ServiceCategory })
  @IsOptional()
  @IsEnum(ServiceCategory)
  category?: ServiceCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;
}

/**
 * Nearby Provider Query DTO
 */
export class NearbyProviderDto {
  @ApiProperty({ example: 46.6753 })
  @Type(() => Number)
  @IsNumber()
  longitude: number;

  @ApiProperty({ example: 24.7136 })
  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @ApiPropertyOptional({ example: 10, description: 'Max distance in km' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Max(100)
  maxDistanceKm?: number;

  @ApiPropertyOptional({ enum: ServiceCategory })
  @IsOptional()
  @IsEnum(ServiceCategory)
  category?: ServiceCategory;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Max(50)
  limit?: number;
}

/**
 * Update Location DTO
 */
export class UpdateLocationDto {
  @ApiProperty({ example: 46.6753 })
  @IsNumber()
  longitude: number;

  @ApiProperty({ example: 24.7136 })
  @IsNumber()
  latitude: number;
}

/**
 * Update Status DTO
 */
export class UpdateStatusDto {
  @ApiProperty({ enum: ProviderStatus })
  @IsEnum(ProviderStatus)
  status: ProviderStatus;
}

export class RejectProviderDto {
  @ApiProperty()
  @IsString()
  reason: string;
}

export class UpdateProviderServicesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(50)
  @ArrayUnique()
  @IsMongoId({ each: true })
  services: string[];

  @ApiPropertyOptional({ enum: ServiceCategory, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(ServiceCategory, { each: true })
  serviceCategories?: ServiceCategory[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  servicePrices?: Record<string, number>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  serviceAvailability?: Record<string, boolean>;
}

export class UpdateProviderWorkingHoursDto {
  @ApiProperty()
  @IsArray()
  @ArrayMinSize(7)
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => WorkingHourDto)
  workingHours: WorkingHourDto[];
}

export class WorkingHourDto {
  @IsString()
  @Matches(/^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)$/)
  day: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  open: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  close: string;

  @IsBoolean()
  isClosed: boolean;
}

export class UpdateProviderDocumentsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  documents: string[];
}

export class UpdateProviderBankAccountDto {
  @ApiProperty()
  @IsObject()
  bankAccount: Record<string, any>;
}
