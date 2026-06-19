import { IsNumber, IsString, IsEnum, IsOptional, Min } from 'class-validator';

export class InitializePaymentDto {
  @IsNumber()
  @Min(100)
  amount: number;

  @IsEnum(['wallet_topup', 'order_payment'])
  purpose: 'wallet_topup' | 'order_payment';

  @IsOptional()
  @IsString()
  targetId?: string; // e.g. orderId if purpose is order_payment
}
