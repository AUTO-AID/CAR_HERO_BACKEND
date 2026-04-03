export declare const generateOtp: (length?: number) => string;
export declare const getOtpExpiry: (minutes?: number) => Date;
export declare const isOtpExpired: (expiryTime: Date) => boolean;
export declare const formatPhoneNumber: (phoneNumber: string, countryCode?: string) => string;
export declare const isValidPhoneNumber: (phoneNumber: string) => boolean;
