import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject, IsDateString, IsArray } from 'class-validator';

class LocationDto {
  @ApiProperty({ example: [31.2357, 30.0444], description: '[longitude, latitude]' })
  @IsArray()
  coordinates: number[];
}

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  providerId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vehicleId?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  scheduleTime?: string;

  @ApiProperty()
  @IsObject()
  location: LocationDto;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
