import {
  IsString,
  IsNotEmpty,
  MinLength,
  Matches,
  IsOptional,
  IsEnum,
  Equals,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'Ahmad Mohammad' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  fullName: string;

  @ApiProperty({ example: '+963991234567' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+963\d{9}$/)
  phoneNumber: string;

  @ApiProperty({ example: 'Password@123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'customer', enum: ['customer', 'provider', 'admin'] })
  @IsOptional()
  @IsEnum(['customer', 'provider', 'admin'])
  accountType?: string;

  @ApiProperty({ example: true })
  @IsNotEmpty()
  @Equals(true, { message: 'Terms and conditions must be accepted' })
  isTermsAccepted: boolean;
}

