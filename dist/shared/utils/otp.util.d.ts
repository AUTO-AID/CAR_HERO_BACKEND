export declare class OtpUtil {
    static generate(length?: number): string;
    static getExpirationTime(minutes: number): Date;
    static isExpired(expiresAt: Date): boolean;
    static formatSyrianPhone(phone: string): string;
    static isValidSyrianPhone(phone: string): boolean;
}
