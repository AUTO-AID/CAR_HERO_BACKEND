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
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ProviderStatus, ServiceCategory, RegistrationStatus } from '../../../../core/enums/status.enum';

const toBoolean = ({ value }: { value: any }) => {
  if (value === undefined || value === null || value === '') return undefined;
  return value === true || value === 'true';
};

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
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  workingHours?: {
    day: string;
    open: string;
    close: string;
    isClosed?: boolean;
  }[];

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
  businessName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
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
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
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
  services: string[];

  @ApiPropertyOptional({ enum: ServiceCategory, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(ServiceCategory, { each: true })
  serviceCategories?: ServiceCategory[];
}

export class UpdateProviderWorkingHoursDto {
  @ApiProperty()
  @IsArray()
  workingHours: {
    day: string;
    open: string;
    close: string;
    isClosed?: boolean;
  }[];
}

export class UpdateProviderDocumentsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  documents: string[];
}

export class UpdateProviderBankAccountDto {
  @ApiProperty()
  @IsObject()
  bankAccount: Record<string, any>;
}
