/**
 * User Entity
 * Domain entity representing a user in the system
 */

export enum UserAccountType {
  CUSTOMER = 'customer',
  PROVIDER = 'provider',
  ADMIN = 'admin',
}

export interface UserPreferences {
  language: string;
  notifications: {
    push: boolean;
    sms: boolean;
    email: boolean;
  };
}

export class UserEntity {
  constructor(
    public readonly id: string,
    public readonly fullName: string,
    public readonly phoneNumber: string,
    public readonly accountType: UserAccountType,
    public readonly profileImage?: string | null,
    public readonly loyaltyLevel: number = 1,
    public readonly isPremium: boolean = false,
    public readonly premiumExpiresAt?: Date | null,
    public readonly preferences?: UserPreferences,
    public readonly isActive: boolean = true,
    public readonly isVerified: boolean = false,
    public readonly lastLoginAt?: Date | null,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  /**
   * Check if user is an admin
   */
  isAdmin(): boolean {
    return this.accountType === UserAccountType.ADMIN;
  }

  /**
   * Check if user is a provider
   */
  isProvider(): boolean {
    return this.accountType === UserAccountType.PROVIDER;
  }

  /**
   * Check if premium status is still valid
   */
  hasValidPremium(): boolean {
    if (!this.isPremium) return false;
    if (!this.premiumExpiresAt) return true; // Lifetime premium if no expiry
    return new Date() < this.premiumExpiresAt;
  }
}
