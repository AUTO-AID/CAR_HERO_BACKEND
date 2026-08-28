import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class SetPresenceDto {
  @ApiProperty({ description: 'true = متصل ومستعد لاستقبال الطلبات' })
  @IsBoolean()
  online: boolean;

  /**
   * الموقع اختياري لكنه مهمّ: «تشغيل الاتصال» بلا موقع محدَّث يجعل الفنّي
   * مرشّحاً بإحداثيات قديمة قد تبعد كيلومترات عن مكانه الحقيقي.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;
}

export class RejectRequestDto {
  @ApiPropertyOptional({ description: 'سبب الرفض (اختياري)' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}

export class CompleteRequestDto {
  @ApiPropertyOptional({ description: 'ملاحظات الفنّي على الخدمة' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class ProviderLocationDto {
  @ApiProperty()
  @Type(() => Number)
  @IsLatitude()
  latitude: number;

  @ApiProperty()
  @Type(() => Number)
  @IsLongitude()
  longitude: number;

  @ApiPropertyOptional({ description: 'دقّة القراءة بالأمتار' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  accuracy?: number;

  @ApiPropertyOptional({ description: 'الاتجاه بالدرجات (0-360)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number;

  @ApiPropertyOptional({ description: 'السرعة بالمتر/ثانية' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  speed?: number;

  /**
   * الطلب النشِط إن وُجد. مع المعرّف تُحدَّث خطّة التتبّع التي يراها العميل،
   * وبدونه يُحدَّث موقع الملف الشخصي فقط (لأغراض الإسناد القريب).
   */
  @ApiPropertyOptional({ description: 'معرّف الطلب النشِط لتحديث تتبّع العميل' })
  @IsOptional()
  @IsMongoId()
  orderId?: string;
}

export class ProviderRegisterDeviceDto {
  @ApiProperty({ description: 'رمز جهاز FCM/Expo لاستقبال الإشعارات' })
  @IsString()
  @MaxLength(500)
  token: string;

  @ApiPropertyOptional({ enum: ['android', 'ios', 'web'] })
  @IsOptional()
  @IsIn(['android', 'ios', 'web'])
  platform?: string;
}

export class ProviderRequestsQueryDto {
  @ApiPropertyOptional({ enum: ['active', 'past'], default: 'active' })
  @IsOptional()
  @IsIn(['active', 'past'])
  scope?: 'active' | 'past';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
