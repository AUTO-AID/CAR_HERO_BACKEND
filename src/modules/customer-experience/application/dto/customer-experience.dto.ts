import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

class CoordinatesDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  label: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
  addressLine: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  note?: string;

  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates: CoordinatesDto;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  addressLine?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  note?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates?: CoordinatesDto;
}

export class CreatePaymentMethodDto {
  // نقداً أو شام كاش فقط. `wallet` و`card` تبقيان في مخطّط القاعدة لقراءة
  // السجلات القديمة، ولا تُقبلان في إنشاء جديد.
  @IsIn(['cash', 'cham_cash'])
  type: 'cash' | 'cham_cash';

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  displayName: string;

  @IsOptional()
  @IsString()
  @MaxLength(4)
  last4?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  providerToken?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdatePaymentMethodDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  providerToken?: string;
}

export class CreateWashPlanDto {
  @IsMongoId()
  vehicleId: string;

  @IsOptional()
  @IsMongoId()
  addressId?: string;

  @IsIn([1, 2, 4])
  visitsPerMonth: number;

  @IsEnum(['external', 'internal', 'full'])
  washType: 'external' | 'internal' | 'full';

  @IsEnum(['morning', 'noon', 'evening'])
  preferredTimeSlot: 'morning' | 'noon' | 'evening';

  @IsOptional()
  @IsBoolean()
  reminderEnabled?: boolean;
}

export class UpdateWashPlanDto {
  @IsOptional()
  @IsMongoId()
  addressId?: string;

  @IsOptional()
  @IsIn([1, 2, 4])
  visitsPerMonth?: number;

  @IsOptional()
  @IsEnum(['external', 'internal', 'full'])
  washType?: 'external' | 'internal' | 'full';

  @IsOptional()
  @IsEnum(['morning', 'noon', 'evening'])
  preferredTimeSlot?: 'morning' | 'noon' | 'evening';

  @IsOptional()
  @IsBoolean()
  reminderEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class RegisterDeviceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  fcmToken: string;

  @IsEnum(['ios', 'android', 'web'])
  platform: 'ios' | 'android' | 'web';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  deviceName?: string;
}

