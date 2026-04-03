export interface IUser {
  _id?: string;
  fullName: string;
  phoneNumber: string;
  accountType: 'customer' | 'provider' | 'admin';
  profileImage?: string;
  pointsBalance: number;
  loyaltyLevel: number;
  isPremium: boolean;
  premiumExpiresAt?: Date;
  preferences?: {
    language: 'ar' | 'en';
    notifications: {
      push: boolean;
      sms: boolean;
      email: boolean;
    };
  };
  isActive: boolean;
  isTermsAccepted: boolean;
  isVerified: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * User Response Interface
 * Used for API responses (without sensitive data)
 */
export interface IUserResponse {
  _id: string;
  fullName: string;
  phoneNumber: string;
  accountType: string;
  profileImage?: string;
  pointsBalance: number;
  loyaltyLevel: number;
  isPremium: boolean;
  premiumExpiresAt?: Date;
  isActive: boolean;
  isTermsAccepted: boolean;
  isVerified: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * User Profile Interface
 * Simplified version for profile display
 */
export interface IUserProfile {
  _id: string;
  fullName: string;
  phoneNumber: string;
  accountType: string;
  profileImage?: string;
  isPremium: boolean;
  pointsBalance: number;
  loyaltyLevel: number;
}

/**
 * User Statistics Interface
 */
export interface IUserStats {
  user: {
    fullName: string;
    phoneNumber: string;
    accountType: string;
    isPremium: boolean;
    loyaltyLevel: number;
    pointsBalance: number;
  };
  stats: {
    totalOrders: number;
    activeOrders: number;
    completedOrders: number;
    totalSpent: number;
    averageRating: number;
  };
}

/**
 * User Query Filters Interface
 */
export interface IUserFilters {
  accountType?: 'customer' | 'provider' | 'admin';
  isPremium?: boolean;
  isActive?: boolean;
  isVerified?: boolean;
  search?: string;
}
