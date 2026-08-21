import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject, IsDateString, IsArray } from 'class-validator';

class LocationDto {
  @ApiProperty({ example: [31.2357, 30.0444], description: '[longitude, latitude]' })
  @IsArray()
  coordinates: number[];
}

/**
 * لا يوجد `providerId` هنا عن قصد.
 *
 * الإسناد آليّ بالكامل: الخادم يبحث عن الأقرب المتاح ثم يعرض الطلب فنّياً بعد
 * فنّي (`ProviderDispatchService`). السماح للعميل باختيار فنّي بعينه كان يعطّل
 * هذه السلسلة — الطلب يعلق عند من اختاره العميل ولو كان مغلقاً تطبيقه — ويفتح
 * باب طلبٍ مُوجَّه إلى فنّي لا يقدّم الخدمة أصلاً.
 */
export class CreateOrderDto {
  @ApiPropertyOptional({ example: '60b8d295f1d293001f3e4c8a', description: 'Injected from JWT for customer requests' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({ example: '60b8d295f1d293001f3e4c8b', description: 'ID of the service requested' })
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiPropertyOptional({ example: '60b8d295f1d293001f3e4c8d', description: 'ID of the vehicle for the service' })
  @IsString()
  @IsOptional()
  vehicleId?: string;

  @ApiPropertyOptional({ example: '2026-05-01T10:00:00Z', description: 'Scheduled time for the service' })
  @IsDateString()
  @IsOptional()
  scheduleTime?: string;

  @ApiProperty({ description: 'Location of the order' })
  @IsObject()
  location: LocationDto;

  @ApiPropertyOptional({ example: 'Please bring a spare tire', description: 'Additional notes for the provider' })
  @IsString()
  @IsOptional()
  notes?: string;
}
