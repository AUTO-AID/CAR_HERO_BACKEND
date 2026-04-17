// confirm-restore-otp.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class ConfirmRestoreOtpDto {
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  otpCode: string;
}
