import { IsNumber, IsIn, IsOptional, IsMongoId, Min, ValidateIf } from 'class-validator';

export class InitializePaymentDto {
  /**
   * مبلغ شحن المحفظة. **يُتجاهل** حين يكون الغرض `order_payment`: مستحقّ
   * الطلب يُقرأ من الطلب نفسه على الخادم.
   */
  @IsNumber()
  @Min(100)
  amount: number;

  @IsIn(['wallet_topup', 'order_payment'])
  purpose: 'wallet_topup' | 'order_payment';

  /** معرّف الطلب — مطلوب حين يكون الغرض دفع طلب */
  @ValidateIf((dto: InitializePaymentDto) => dto.purpose === 'order_payment')
  @IsMongoId()
  @IsOptional()
  targetId?: string;
}
