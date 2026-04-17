import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, ValidateNested, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export class LocationDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsString()
  @IsOptional()
  address?: string;
}

export class SendMessageDto {
  @IsMongoId()
  @IsNotEmpty()
  chatId: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType;

  @IsString()
  @IsOptional()
  fileUrl?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;
}

export class CreateChatDto {
  @IsMongoId()
  @IsNotEmpty()
  participantId: string;

  @IsMongoId()
  @IsOptional()
  orderId?: string;
}
