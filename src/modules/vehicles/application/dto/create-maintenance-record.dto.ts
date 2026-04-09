/**
 * Create Maintenance Record DTO
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, IsDateString, Min } from 'class-validator';

export class CreateMaintenanceRecordDto {
  @ApiProperty({ example: 'تغيير زيت المحرك', description: 'Type of maintenance service' })
  @IsString()
  @IsNotEmpty()
  serviceType: string;

  @ApiPropertyOptional({ example: 'تم تغيير الزيت مع الفلتر', description: 'Detailed description of the service' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '2025-01-15T10:30:00.000Z', description: 'Date of maintenance' })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ example: 50000, description: 'Vehicle mileage at maintenance time' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  mileage?: number;

  @ApiPropertyOptional({ example: 250, description: 'Cost of maintenance in SAR' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  cost?: number;

  @ApiPropertyOptional({ example: 'ورشة النور', description: 'Service provider name' })
  @IsString()
  @IsOptional()
  provider?: string;

  @ApiPropertyOptional({ example: 'الرياض', description: 'Service location' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ example: 'INV-2025-001', description: 'Invoice number' })
  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @ApiPropertyOptional({ example: ['فلتر زيت', 'زيت محرك 5W30'], description: 'Parts replaced or used' })
  @IsArray()
  @IsOptional()
  parts?: string[];

  @ApiPropertyOptional({ example: 'ملاحظات إضافية', description: 'Additional notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: ['https://example.com/receipt.jpg'], description: 'Attachment URLs (receipts, photos)' })
  @IsArray()
  @IsOptional()
  attachments?: string[];
}
