"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidatorUtil = void 0;
class ValidatorUtil {
    static isValidSyrianPhone(phone) {
        const regex = /^\+963\d{9}$/;
        return regex.test(phone);
    }
    static isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
    static isValidObjectId(id) {
        return /^[0-9a-fA-F]{24}$/.test(id);
    }
}
exports.ValidatorUtil = ValidatorUtil;
//# sourceMappingURL=validator.util.js.map