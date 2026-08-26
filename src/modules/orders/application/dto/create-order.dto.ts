import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject, IsDateString, IsArray, IsMongoId } from 'class-validator';

class LocationDto {
  @ApiProperty({ example: [31.2357, 30.0444], description: '[longitude, latitude]' })
  @IsArray()
  coordinates: number[];
}

/**
 * لا `providerId` عام هنا — الإسناد الآليّ لا يزال كما هو. الاستثناء الوحيد
 * هو `requestedProviderId` أدناه: العميل اختار هذا المزوّد تحديداً من قائمة
 * (أقرب مزوّدين يقدّمون الخدمة فعلياً، مع سعر كلٍّ منهم) وليس اسماً حرّاً —
 * `CreateOrderUseCase` يتحقّق أنه متّصل ويقدّم الخدمة وغير مشغول قبل قبوله،
 * والطلب يُرسَل له وحده بلا تصعيد لغيره عند الرفض (`ProviderDispatchService`،
 * `metadata.directRequest`). هذا يختلف جوهرياً عمّا رفضه هذا التعليق سابقاً:
 * ذاك كان يسمح باسم فنّي حرّ بلا تحقّق يُعطّل سلسلة التوزيع الآلي للطلب
 * العادي؛ هذا مسار منفصل صراحةً لا يمسّ ذلك الطلب العادي بشيء.
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

  @ApiPropertyOptional({ description: 'Provider the customer explicitly chose from the nearby-with-price list. Request goes to them alone.' })
  @IsMongoId()
  @IsOptional()
  requestedProviderId?: string;
}
