"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_MESSAGES = void 0;
exports.ERROR_MESSAGES = {
    AUTH: {
        INVALID_CREDENTIALS: 'Invalid phone number or password',
        ACCOUNT_NOT_VERIFIED: 'Please verify your account first',
        ACCOUNT_DEACTIVATED: 'Your account has been deactivated. Please contact support',
        UNAUTHORIZED: 'Unauthorized. Please login',
        FORBIDDEN: 'You do not have permission to access this resource',
        TOKEN_EXPIRED: 'Token has expired. Please login again',
        INVALID_TOKEN: 'Invalid or expired token',
        INVALID_REFRESH_TOKEN: 'Invalid or expired refresh token',
        PASSWORDS_DO_NOT_MATCH: 'Passwords do not match',
    },
    USER: {
        NOT_FOUND: 'User not found',
        ALREADY_EXISTS: 'Phone number is already registered',
        PHONE_INVALID: 'Invalid phone number format. Must start with +963 followed by 9 digits',
    },
    OTP: {
        INVALID: 'Invalid OTP code',
        EXPIRED: 'OTP code has expired. Please request a new one',
        MAX_ATTEMPTS: 'Maximum OTP attempts reached. Please request a new code',
        ALREADY_VERIFIED: 'Account is already verified',
    },
    PASSWORD: {
        WEAK: 'Password must be at least 6 characters and contain at least one uppercase letter and one number',
        MISMATCH: 'Passwords do not match',
        INCORRECT: 'Incorrect password',
    },
    VALIDATION: {
        REQUIRED_FIELD: 'This field is required',
        INVALID_FORMAT: 'Invalid format',
    },
    POINTS: {
        INSUFFICIENT: 'Insufficient points balance',
    },
    GENERAL: {
        INTERNAL_SERVER_ERROR: 'Something went wrong. Please try again later',
        NOT_FOUND: 'Resource not found',
        BAD_REQUEST: 'Bad request',
        SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
    },
};
//# sourceMappingURL=error-messages.constant.js.map