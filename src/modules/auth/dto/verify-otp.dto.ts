import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ example: '+963991234567' })
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^\+963\d{9}$/)
  phoneNumber: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP code' })
  @IsString()
  @IsNotEmpty({ message: 'OTP code is required' })
  @Length(6, 6, { message: 'OTP code must be 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP code must contain only numbers' })
  otpCode: string;
}

