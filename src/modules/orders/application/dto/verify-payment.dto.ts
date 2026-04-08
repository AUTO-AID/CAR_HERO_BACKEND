import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class VerifyPaymentDto {
  @ApiProperty({ example: 'pay_ABC123xyz', description: 'Transaction ID from payment gateway' })
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @ApiProperty({ example: 'stripe', description: 'Payment method used' })
  @IsString()
  @IsOptional()
  paymentMethod?: string;
}
