import { ArrayUnique, IsArray, IsBoolean, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export const ADMIN_PERMISSIONS = [
  '*',
  'admin.profile',
  'admins.read',
  'admins.create',
  'admins.update',
  'admins.delete',
  'analytics.read',
  'audit.read',
  'finance.read',
  'providers.read',
  'providers.approve',
  'providers.reject',
  'providers.update',
  'services.read',
  'services.create',
  'services.update',
  'services.delete',
  'subscriptions.read',
  'subscriptions.create',
  'subscriptions.update',
  'subscriptions.delete',
  'settings.read',
  'settings.update',
  'users.read',
  'users.update',
  'users.delete',
  'users.status',
] as const;

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
