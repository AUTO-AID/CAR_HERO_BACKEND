import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: '+963991234567' })
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^\+963\d{9}$/)
  phoneNumber: string;

  @ApiProperty({ example: 'Ahmed@123' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}

