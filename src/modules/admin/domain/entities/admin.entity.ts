/**
 * Admin Entity
 * Represents the core administrative user in the domain layer.
 */
import { Role } from '../../../../core/enums/roles.enum';

export class AdminEntity {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly role: Role,
    public readonly isActive: boolean,
    public readonly permissions: string[],
    public readonly password?: string,
    public readonly avatar?: string,
    public readonly lastLoginAt?: Date,
    public readonly lastLoginIp?: string,
    public readonly refreshToken?: string,
    public readonly metadata?: Record<string, any>,
  ) {}

  /**
   * Checks if the admin has a specific permission
   */
  hasPermission(permission: string): boolean {
    if (this.permissions.includes('all')) return true;
    return this.permissions.includes(permission);
  }

  /**
   * Checks if the admin account is eligible for login
   */
  canLogin(): boolean {
    return this.isActive;
  }
}
