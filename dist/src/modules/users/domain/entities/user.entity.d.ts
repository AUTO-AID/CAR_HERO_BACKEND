export declare enum UserAccountType {
    CUSTOMER = "customer",
    PROVIDER = "provider",
    ADMIN = "admin"
}
export interface UserPreferences {
    language: string;
    notifications: {
        push: boolean;
        sms: boolean;
        email: boolean;
    };
}
export declare class UserEntity {
    readonly id: string;
    readonly fullName: string;
    readonly phoneNumber: string;
    readonly accountType: UserAccountType;
    readonly profileImage?: string | null | undefined;
    readonly pointsBalance: number;
    readonly loyaltyLevel: number;
    readonly isPremium: boolean;
    readonly premiumExpiresAt?: (Date | null) | undefined;
    readonly preferences?: UserPreferences | undefined;
    readonly isActive: boolean;
    readonly isVerified: boolean;
    readonly lastLoginAt?: (Date | null) | undefined;
    readonly createdAt?: Date | undefined;
    readonly updatedAt?: Date | undefined;
    constructor(id: string, fullName: string, phoneNumber: string, accountType: UserAccountType, profileImage?: string | null | undefined, pointsBalance?: number, loyaltyLevel?: number, isPremium?: boolean, premiumExpiresAt?: (Date | null) | undefined, preferences?: UserPreferences | undefined, isActive?: boolean, isVerified?: boolean, lastLoginAt?: (Date | null) | undefined, createdAt?: Date | undefined, updatedAt?: Date | undefined);
    isAdmin(): boolean;
    isProvider(): boolean;
    hasValidPremium(): boolean;
}
