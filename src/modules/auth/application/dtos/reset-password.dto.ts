import {
  IsString,
  IsNotEmpty,
  MinLength,
  Matches,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: '+963991234567' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+963\d{9}$/)
  phoneNumber: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  otpCode: string;

  @ApiProperty({ example: 'NewPassword@123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter and one number',
  })
  newPassword: string;

  // @ApiProperty({ example: 'NewPassword@123' })
  // @IsString()
  // @IsNotEmpty()
  // confirmNewPassword: string;
}
