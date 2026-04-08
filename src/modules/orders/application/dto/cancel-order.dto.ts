import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CancelOrderDto {
  @ApiProperty({ example: 'Changed my mind', description: 'Reason for cancellation' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ example: 'user', description: 'Who is cancelling (user, provider, admin)' })
  @IsString()
  @IsOptional()
  cancelledBy?: string;
}
