export class OtpUtil {
  /**
   * توليد OTP برقم محدد من الأرقام
   */
  static generate(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * digits.length);
      otp += digits[randomIndex];
    }
    
    return otp;
  }

  /**
   * الحصول على وقت انتهاء الصلاحية
   */
  static getExpirationTime(minutes: number): Date {
    const now = new Date();
    return new Date(now.getTime() + minutes * 60000);
  }

  /**
   * التحقق من انتهاء الصلاحية
   */
  static isExpired(expiresAt: Date): boolean {
    return new Date() > new Date(expiresAt);
  }

  /**
   * تنسيق رقم الهاتف السوري
   */
  static formatSyrianPhone(phone: string): string {
    // إزالة أي مسافات أو رموز
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // إذا كان يبدأ بـ 0، استبدلها بـ +963
    if (cleaned.startsWith('0')) {
      cleaned = '+963' + cleaned.substring(1);
    }
    
    // إذا لم يكن يبدأ بـ +963، أضفها
    if (!cleaned.startsWith('+963')) {
      cleaned = '+963' + cleaned;
    }
    
    return cleaned;
  }

  static isValidSyrianPhone(phone: string): boolean {
    const regex = /^\+963\d{9}$/;
    return regex.test(phone);
  }
}