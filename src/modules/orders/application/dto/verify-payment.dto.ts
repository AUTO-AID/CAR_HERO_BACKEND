import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { PaymentMethod } from '../../../../core/enums/status.enum';

export class VerifyPaymentDto {
  @ApiProperty({ example: 'pay_ABC123xyz', description: 'Transaction ID from payment gateway' })
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CARD, description: 'Payment method used' })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}
