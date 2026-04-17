// request-restore-otp.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class RequestRestoreOtpDto {
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}
