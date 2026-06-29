import { ArrayUnique, IsArray, IsBoolean, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ADMIN_PERMISSIONS } from '../../../../core/constants';

export { ADMIN_PERMISSIONS };

const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/;

export class CreateAdminDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEmail()
  @MaxLength(160)
  email: string;

  @IsString()
  @Matches(PASSWORD_PATTERN, { message: 'Password must be at least 8 characters and contain uppercase, lowercase, and numeric characters' })
  password: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(ADMIN_PERMISSIONS, { each: true })
  permissions?: string[];
}

export class UpdateAdminPermissionsDto {
  @IsArray()
  @ArrayUnique()
  @IsIn(ADMIN_PERMISSIONS, { each: true })
  permissions: string[];
}

export class UpdateAdminStatusDto {
  @IsBoolean()
  isActive: boolean;
}

export class ResetAdminPasswordDto {
  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_PATTERN, { message: 'Password must contain uppercase, lowercase, and numeric characters' })
  password: string;
}
