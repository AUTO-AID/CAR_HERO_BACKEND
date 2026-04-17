"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserEntity = exports.UserAccountType = void 0;
var UserAccountType;
(function (UserAccountType) {
    UserAccountType["CUSTOMER"] = "customer";
    UserAccountType["PROVIDER"] = "provider";
    UserAccountType["ADMIN"] = "admin";
})(UserAccountType || (exports.UserAccountType = UserAccountType = {}));
class UserEntity {
    id;
    fullName;
    phoneNumber;
    accountType;
    profileImage;
    pointsBalance;
    loyaltyLevel;
    isPremium;
    premiumExpiresAt;
    preferences;
    isActive;
    isVerified;
    lastLoginAt;
    createdAt;
    updatedAt;
    constructor(id, fullName, phoneNumber, accountType, profileImage, pointsBalance = 0, loyaltyLevel = 1, isPremium = false, premiumExpiresAt, preferences, isActive = true, isVerified = false, lastLoginAt, createdAt, updatedAt) {
        this.id = id;
        this.fullName = fullName;
        this.phoneNumber = phoneNumber;
        this.accountType = accountType;
        this.profileImage = profileImage;
        this.pointsBalance = pointsBalance;
        this.loyaltyLevel = loyaltyLevel;
        this.isPremium = isPremium;
        this.premiumExpiresAt = premiumExpiresAt;
        this.preferences = preferences;
        this.isActive = isActive;
        this.isVerified = isVerified;
        this.lastLoginAt = lastLoginAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    isAdmin() {
        return this.accountType === UserAccountType.ADMIN;
    }
    isProvider() {
        return this.accountType === UserAccountType.PROVIDER;
    }
    hasValidPremium() {
        if (!this.isPremium)
            return false;
        if (!this.premiumExpiresAt)
            return true;
        return new Date() < this.premiumExpiresAt;
    }
}
exports.UserEntity = UserEntity;
//# sourceMappingURL=user.entity.js.map