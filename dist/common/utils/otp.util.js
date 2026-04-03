"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidPhoneNumber = exports.formatPhoneNumber = exports.isOtpExpired = exports.getOtpExpiry = exports.generateOtp = void 0;
const generateOtp = (length = 6) => {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
};
exports.generateOtp = generateOtp;
const getOtpExpiry = (minutes = 5) => {
    return new Date(Date.now() + minutes * 60 * 1000);
};
exports.getOtpExpiry = getOtpExpiry;
const isOtpExpired = (expiryTime) => {
    return new Date() > new Date(expiryTime);
};
exports.isOtpExpired = isOtpExpired;
const formatPhoneNumber = (phoneNumber, countryCode = '+966') => {
    let cleaned = phoneNumber.replace(/\D/g, '');
    cleaned = cleaned.replace(/^0+/, '');
    if (!cleaned.startsWith(countryCode.replace('+', ''))) {
        cleaned = countryCode.replace('+', '') + cleaned;
    }
    return '+' + cleaned;
};
exports.formatPhoneNumber = formatPhoneNumber;
const isValidPhoneNumber = (phoneNumber) => {
    const e164Pattern = /^\+[1-9]\d{6,14}$/;
    return e164Pattern.test(phoneNumber);
};
exports.isValidPhoneNumber = isValidPhoneNumber;
//# sourceMappingURL=otp.util.js.map