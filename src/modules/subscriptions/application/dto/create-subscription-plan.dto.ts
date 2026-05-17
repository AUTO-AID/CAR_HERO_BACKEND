import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateSubscriptionPlanDto {
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

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  durationDays: number;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  featuresAr?: string[];

  @ApiPropertyOptional({ enum: ['basic', 'silver', 'gold', 'platinum'] })
  @IsIn(['basic', 'silver', 'gold', 'platinum'])
  @IsOptional()
  tier?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
