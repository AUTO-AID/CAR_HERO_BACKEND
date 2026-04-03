/**
 * OTP Utilities
 * Helper functions for OTP generation and validation
 */

/**
 * Generate a random numeric OTP
 * @param length Length of the OTP (default: 6)
 * @returns Generated OTP as string
 */
export const generateOtp = (length: number = 6): string => {
  const digits = '0123456789';
  let otp = '';

  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }

  return otp;
};

/**
 * Calculate OTP expiry time
 * @param minutes Minutes until expiry (default: 5)
 * @returns Expiry date
 */
export const getOtpExpiry = (minutes: number = 5): Date => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

/**
 * Check if OTP has expired
 * @param expiryTime Expiry time of the OTP
 * @returns True if expired, false otherwise
 */
export const isOtpExpired = (expiryTime: Date): boolean => {
  return new Date() > new Date(expiryTime);
};

/**
 * Format phone number to E.164 format
 * @param phoneNumber Phone number to format
 * @param countryCode Country code (default: +966 for Saudi Arabia)
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (
  phoneNumber: string,
  countryCode: string = '+966',
): string => {
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');

  // Remove leading zeros
  cleaned = cleaned.replace(/^0+/, '');

  // Add country code if not present
  if (!cleaned.startsWith(countryCode.replace('+', ''))) {
    cleaned = countryCode.replace('+', '') + cleaned;
  }

  return '+' + cleaned;
};

/**
 * Validate phone number format
 * @param phoneNumber Phone number to validate
 * @returns True if valid, false otherwise
 */
export const isValidPhoneNumber = (phoneNumber: string): boolean => {
  // Basic E.164 format validation
  const e164Pattern = /^\+[1-9]\d{6,14}$/;
  return e164Pattern.test(phoneNumber);
};
