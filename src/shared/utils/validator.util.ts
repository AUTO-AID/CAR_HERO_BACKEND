export class ValidatorUtil {
  static isValidSyrianPhone(phone: string): boolean {
    const regex = /^\+963\d{9}$/;
    return regex.test(phone);
  }

  static isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  static isValidObjectId(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }
}

