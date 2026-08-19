import {
  IsString,
  IsNotEmpty,
  MinLength,
  Matches,
  Length,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { isOtpBypassed } from '../../../../config/dev-flags';

export class ResetPasswordDto {
  @ApiProperty({ example: '+963991234567' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+963\d{9}$/)
  phoneNumber: string;

  // TEMPORARY (see config/dev-flags.ts): while the development OTP bypass is
  // active this field is not required. The rules below are unchanged and apply
  // in full as soon as the flag is off — including always in production.
  @ApiProperty({ example: '654321' })
  @ValidateIf(() => !isOtpBypassed())
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  otpCode: string;

  @ApiProperty({ example: 'NewPassword@123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter and one number',
  })
  newPassword: string;

  // @ApiProperty({ example: 'NewPassword@123' })
  // @IsString()
  // @IsNotEmpty()
  // confirmNewPassword: string;
}
