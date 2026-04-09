import { IsString, IsNotEmpty, IsDateString, IsOptional, IsArray, ValidateNested, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

class SelectedOptionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  price: number;
}

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  coordinates: number[]; // [long, lat]

  @IsString()
  @IsOptional()
  address?: string;

  @IsBoolean()
  @IsOptional()
  isScheduled?: boolean;

  @IsDateString()
  @IsOptional()
  scheduledDate?: string;

  @IsString()
  @IsOptional()
  scheduledTime?: string;

  @IsString()
  @IsOptional()
  vehicleId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectedOptionDto)
  @IsOptional()
  selectedOptions?: SelectedOptionDto[];

  @IsString()
  @IsOptional()
  promoCode?: string;

  @IsString()
  @IsOptional()
  userNotes?: string;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string;
}
