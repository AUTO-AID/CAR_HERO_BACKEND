export class SanitizeUtil {

  static user(user: any): any {
    if (!user) return null;

    // Convert Mongoose document to plain object if needed
    const userObject = user.toObject ? user.toObject() : { ...user };
    
    // Remove sensitive fields
    delete userObject.password;
    delete userObject.otpCode;
    delete userObject.otpExpiresAt;
    delete userObject.otpAttempts;
    delete userObject.refreshToken;
    delete userObject.__v;

    // Convert _id to string if it's an ObjectId
    if (userObject._id && typeof userObject._id !== 'string') {
      userObject._id = userObject._id.toString();
    }

    return userObject;
  }

  /**
   * Remove sensitive fields from array of users
   */
  static users(users: any[]): any[] {
    if (!users || !Array.isArray(users)) return [];
    return users.map(user => this.user(user));
  }

  /**
   * Sanitize multiple fields at once
   */
  static sanitizeFields<T extends Record<string, any>>(
    obj: T,
    fieldsToRemove: string[],
  ): Partial<T> {
    if (!obj) return {};

    const sanitized = { ...obj };
    fieldsToRemove.forEach(field => {
      delete sanitized[field];
    });

    return sanitized;
  }

  /**
   * Deep sanitize object (removes sensitive fields recursively)
   */
  static deepSanitize(obj: any): any {
    if (!obj) return null;
    if (typeof obj !== 'object') return obj;

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
        } else {
          sanitized[key] = obj[key];
        }
      }
    }

    return sanitized;
  }
}