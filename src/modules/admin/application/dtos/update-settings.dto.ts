import { IsBoolean, IsEmail, IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateAppSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  appName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactPhone?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  commissionRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minWithdrawalAmount?: number;

  @IsOptional()
  @IsString()
  @IsIn(['SYP', 'SAR', 'USD'])
  defaultCurrency?: string;
}

export class UpdateMaintenanceDto {
  @IsBoolean()
  maintenanceMode: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  messageAr?: string;
}
