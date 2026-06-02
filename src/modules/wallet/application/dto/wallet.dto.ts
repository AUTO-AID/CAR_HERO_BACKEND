import { IsMongoId, IsNumber, IsPositive, IsString, IsOptional } from 'class-validator';

export class DepositDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  paymentId?: string;
}

export class WithdrawDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  bankAccount: string;

  @IsString()
  @IsOptional()
  bankName?: string;
}

export class RedeemPointsDto {
  @IsNumber()
  @IsPositive()
  points: number;

  @IsString()
  @IsMongoId()
  @IsOptional()
  orderId?: string;
}
