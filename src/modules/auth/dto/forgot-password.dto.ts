import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: '+963991234567' })
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^\+963\d{9}$/)
  phoneNumber: string;
}

