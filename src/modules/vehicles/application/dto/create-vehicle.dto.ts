/**
 * Create Vehicle DTO
 * Data transfer object for creating a new vehicle
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, IsArray, Min, Max } from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({ example: 'Kia', description: 'Vehicle brand/manufacturer' })
  @IsString()
  @IsNotEmpty()
  brand: string;

  @ApiProperty({ example: 'Rio', description: 'Vehicle model' })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiProperty({ example: 2020, description: 'Year of manufacture' })
  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year: number;

  @ApiProperty({ example: 'أبيض', description: 'Vehicle color' })
  @IsString()
  @IsNotEmpty()
  color: string;

  @ApiProperty({ example: 'أ ب ش 1234', description: 'License plate number' })
  @IsString()
  @IsNotEmpty()
  plateNumber: string;

  @ApiPropertyOptional({ example: 'بنزين', description: 'Fuel type (بنزين، ديزل، كهرباء، هايبرد)' })
  @IsString()
  @IsOptional()
  fuelType?: string;

  @ApiPropertyOptional({ example: 'أوتوماتيك', description: 'Transmission type (عادي، أوتوماتيك)' })
  @IsString()
  @IsOptional()
  transmission?: string;

  @ApiPropertyOptional({ example: '1HGBH41JXMN109186', description: 'Vehicle Identification Number (17 chars)' })
  @IsString()
  @IsOptional()
  vin?: string;

  @ApiPropertyOptional({ example: 'عادي', description: 'Engine type (Petrol, Diesel, Electric, Hybrid)' })
  @IsString()
  @IsOptional()
  engineType?: string;

  @ApiPropertyOptional({ example: 'عادي', description: 'Plate type' })
  @IsString()
  @IsOptional()
  plateType?: string;

  @ApiPropertyOptional({ example: ['https://example.com/car1.jpg'], description: 'Vehicle images' })
  @IsArray()
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({ example: false, description: 'Set as default vehicle' })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Is vehicle active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}
