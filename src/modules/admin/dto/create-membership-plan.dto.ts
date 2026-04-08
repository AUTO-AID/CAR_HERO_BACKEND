import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PlanBenefitDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  nameAr: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  value?: string;
}

export class CreateMembershipPlanDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  nameAr: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @ApiProperty()
  @IsNumber()
  price: number;

  @ApiProperty()
  @IsNumber()
  durationDays: number;

  @ApiPropertyOptional({ default: 'SAR' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ type: [PlanBenefitDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanBenefitDto)
  @IsOptional()
  benefits?: PlanBenefitDto[];

  @ApiPropertyOptional({ default: 0 })
  @IsNumber()
  @IsOptional()
  serviceDiscount?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsNumber()
  @IsOptional()
  emergencyDiscount?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsNumber()
  @IsOptional()
  freeEmergencyServices?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsNumber()
  @IsOptional()
  freeTowingKm?: number;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  prioritySupport?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsNumber()
  @IsOptional()
  loyaltyPointsMultiplier?: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}
