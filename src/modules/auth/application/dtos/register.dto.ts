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

export class RegisterDto {
  @ApiProperty({
    example: 'Ahmad Mohammad Ali',
    description: 'Full name of the user',
  })
  
  @IsString({ message: 'Full name must be a string' })
  @IsNotEmpty({ message: 'Full name is required' })
  @MinLength(3, { message: 'Full name must be at least 3 characters' })
  fullName: string;

  @ApiProperty({
    example: '+963991234567',
    description: 'Syrian phone number (must start with +963)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^\+963\d{9}$/, {
    message:
      'Phone number must start with +963 followed by 9 digits (example: +963991234567)',
  })
  phoneNumber: string;

  @ApiProperty({
    example: 'Ahmed@123',
    description:
      'Password (min 8 chars, must contain uppercase letter and number)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter and one number',
  })
  password: string;

  @ApiProperty({
    example: 'customer',
    description: 'Account type',
    enum: ['customer', 'provider'],
    default: 'customer',
  })
  @IsOptional()
  @IsEnum(['customer', 'provider'])
  accountType?: string;

  @ApiProperty({
    example: true,
    description: 'User acceptance of terms and conditions',
  })
  @IsNotEmpty({ message: 'Terms and conditions must be accepted' })
  @Equals(true, { message: 'Terms and conditions must be accepted' })
  isTermsAccepted: boolean;
}
