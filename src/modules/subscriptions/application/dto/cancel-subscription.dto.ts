import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CancelSubscriptionDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  cancelImmediately?: boolean;
}
