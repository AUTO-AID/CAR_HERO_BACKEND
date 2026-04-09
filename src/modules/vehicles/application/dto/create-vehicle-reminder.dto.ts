/**
 * Create Vehicle Reminder DTO
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsDateString, IsEnum, Min } from 'class-validator';
import { ReminderType, ReminderFrequency } from '../../domain/entities/vehicle-reminder.entity';

export class CreateVehicleReminderDto {
  @ApiProperty({ enum: ReminderType, example: ReminderType.OIL_CHANGE, description: 'نوع التذكير' })
  @IsEnum(ReminderType)
  @IsNotEmpty()
  type: ReminderType;

  @ApiProperty({ example: 'تغيير زيت المحرك', description: 'عنوان التذكير' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'كل 5000 كم', description: 'وصف إضافي' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '2025-03-01T10:00:00.000Z', description: 'تاريخ التذكير' })
  @IsDateString()
  @IsOptional()
  reminderDate?: string;

  @ApiPropertyOptional({ example: 50000, description: 'عداد السيارة للتذكير بالكم' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  mileageThreshold?: number;

  @ApiPropertyOptional({ example: 48000, description: 'عداد السيارة الحالي' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  currentMileage?: number;

  @ApiPropertyOptional({ enum: ReminderFrequency, example: ReminderFrequency.MONTHLY, description: 'تكرار التذكير' })
  @IsEnum(ReminderFrequency)
  @IsOptional()
  frequency?: ReminderFrequency;

  @ApiPropertyOptional({ example: true, description: 'تذكير متكرر' })
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @ApiPropertyOptional({ example: 'ملاحظات إضافية', description: 'ملاحظات' })
  @IsString()
  @IsOptional()
  notes?: string;
}
