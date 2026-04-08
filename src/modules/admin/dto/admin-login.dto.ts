import { IsEmail, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminLoginDto {
  @ApiProperty({ example: 'admin@carhero.com', description: 'Admin email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Admin@123', description: 'Admin password' })
  @IsNotEmpty()
  @Matches(/^(?=.*[A-Z])(?=.*\d).{6,}$/, {
    message: 'Password must be at least 6 characters and contain at least one uppercase letter and one digit',
  })
  password: string;
}
