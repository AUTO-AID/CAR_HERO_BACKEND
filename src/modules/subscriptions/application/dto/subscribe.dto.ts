import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

export class SubscribeDto {
  @ApiProperty()
  @IsString()
  planId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  paymentId?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
