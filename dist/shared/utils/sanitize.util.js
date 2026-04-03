"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SanitizeUtil = void 0;
class SanitizeUtil {
    static user(user) {
        if (!user)
            return null;
        const userObject = user.toObject ? user.toObject() : { ...user };
        delete userObject.password;
        delete userObject.otpCode;
        delete userObject.otpExpiresAt;
        delete userObject.otpAttempts;
        delete userObject.refreshToken;
        delete userObject.__v;
        if (userObject._id && typeof userObject._id !== 'string') {
            userObject._id = userObject._id.toString();
        }
        return userObject;
    }
    static users(users) {
        if (!users || !Array.isArray(users))
            return [];
        return users.map(user => this.user(user));
    }
    static sanitizeFields(obj, fieldsToRemove) {
        if (!obj)
            return {};
        const sanitized = { ...obj };
        fieldsToRemove.forEach(field => {
            delete sanitized[field];
        });
        return sanitized;
    }
    static deepSanitize(obj) {
        if (!obj)
            return null;
        if (typeof obj !== 'object')
            return obj;
        const sensitiveFields = [
            'password',
            'otpCode',
            'otpExpiresAt',
            'otpAttempts',
            'refreshToken',
            '__v',
        ];
        const sanitized = Array.isArray(obj) ? [] : {};
        for (const key in obj) {
            if (!sensitiveFields.includes(key)) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    sanitized[key] = this.deepSanitize(obj[key]);
                }
                else {
                    sanitized[key] = obj[key];
                }
            }
        }
        return sanitized;
    }
}
exports.SanitizeUtil = SanitizeUtil;
//# sourceMappingURL=sanitize.util.js.map