import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { ACTIVE_PAYMENT_METHODS, PaymentMethod } from '../../../../core/enums/status.enum';

export class VerifyPaymentDto {
  @ApiProperty({ example: 'pay_ABC123xyz', description: 'Transaction ID from payment gateway' })
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  /**
   * `IsIn` على القائمة الفعّالة لا `IsEnum` على النوع كلّه: النوع يحتفظ
   * بالقيم المتقاعدة لقراءة الطلبات القديمة، وقبولها هنا يعيد إحياءها.
   */
  @ApiProperty({
    enum: ACTIVE_PAYMENT_METHODS,
    example: PaymentMethod.CASH,
    description: 'Payment method used. Only cash, points and cham_cash are accepted.',
  })
  @IsIn(ACTIVE_PAYMENT_METHODS as unknown as string[])
  paymentMethod: PaymentMethod;
}
