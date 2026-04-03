"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpUtil = void 0;
class OtpUtil {
    static generate(length = 6) {
        const digits = '0123456789';
        let otp = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * digits.length);
            otp += digits[randomIndex];
        }
        return otp;
    }
    static getExpirationTime(minutes) {
        const now = new Date();
        return new Date(now.getTime() + minutes * 60000);
    }
    static isExpired(expiresAt) {
        return new Date() > new Date(expiresAt);
    }
    static formatSyrianPhone(phone) {
        let cleaned = phone.replace(/[\s\-\(\)]/g, '');
        if (cleaned.startsWith('0')) {
            cleaned = '+963' + cleaned.substring(1);
        }
        if (!cleaned.startsWith('+963')) {
            cleaned = '+963' + cleaned;
        }
        return cleaned;
    }
    static isValidSyrianPhone(phone) {
        const regex = /^\+963\d{9}$/;
        return regex.test(phone);
    }
}
exports.OtpUtil = OtpUtil;
//# sourceMappingURL=otp.util.js.map