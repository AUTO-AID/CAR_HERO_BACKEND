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
import { ACTIVE_SERVICE_CATEGORIES, ServiceCategory } from '../../../../core/enums/status.enum';

export class CreateServiceDto {
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

  /**
   * الفئات النشطة فقط، لا `ServiceCategory` كاملاً: النوع يحتفظ بفئات متقاعدة
   * لقراءة وثائق قديمة، وقبولها هنا يعيد إنشاء خدمة خارج الكتالوج التسع —
   * فتظهر في اللوحة ولا تجد لها أيقونة ولا اسماً عربياً في التطبيق.
   */
  @ApiProperty({ enum: ACTIVE_SERVICE_CATEGORIES })
  @IsIn(ACTIVE_SERVICE_CATEGORIES as unknown as string[])
  category: ServiceCategory;

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discountedPrice?: number;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  estimatedDuration: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isEmergency?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isSystemService?: boolean;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  provider?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  options?: Array<Record<string, any>>;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
