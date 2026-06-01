import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject, IsNumber, IsEnum, IsDateString, IsArray } from 'class-validator';

export class ClientLocationDto {
  @ApiProperty({ example: 33.5138, description: 'Latitude of the client location' })
  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @ApiProperty({ example: 36.2765, description: 'Longitude of the client location' })
  @IsNumber()
  @IsNotEmpty()
  lng: number;
}

export class RecommendProviderDto {
  @ApiProperty({ example: 'Mechanical', description: 'Category or type of service requested (e.g., Mechanical, Electrical)' })
  @IsString()
  @IsNotEmpty()
  serviceCategory: string;

  @ApiProperty({ example: 'Damascus', description: 'City or governorate where service is requested' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ type: ClientLocationDto, description: 'Geo-coordinates of the client' })
  @IsObject()
  @IsNotEmpty()
  location: ClientLocationDto;

  @ApiProperty({ example: 'normal', enum: ['normal', 'emergency'], description: 'Urgency level of the service request' })
  @IsEnum(['normal', 'emergency'])
  @IsNotEmpty()
  urgencyLevel: string;

  @ApiPropertyOptional({ example: '2026-05-26T22:30:00Z', description: 'Preferred time for scheduling the service (optional)' })
  @IsDateString()
  @IsOptional()
  preferredTime?: string;

  @ApiPropertyOptional({ example: 'Sedan', description: 'Vehicle type or specification (optional)' })
  @IsString()
  @IsOptional()
  vehicleType?: string;

  @ApiPropertyOptional({ example: ['60b8d295f1d293001f3e4c8b'], description: 'List of provider IDs to exclude from recommendation (optional)' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  excludeProviderIds?: string[];
}
