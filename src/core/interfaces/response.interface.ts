export interface IApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
  timestamp?: string;
  path?: string;
}

export interface IAuthResponse {
  user: IUserResponse;
  accessToken: string;
  refreshToken: string;
}

export interface IOtpResponse {
  message: string;
  phoneNumber: string;
  expiresIn: number;
  /**
   * TEMPORARY (see config/dev-flags.ts): set when the development OTP bypass is
   * active, telling the client to skip the OTP screen. Absent in production.
   */
  otpBypassed?: boolean;
}

export interface IUserResponse {
  _id: string;
  fullName: string;
  phoneNumber: string;
  accountType: string;
  loyaltyLevel: number;
  isPremium: boolean;
  premiumExpiresAt?: Date;
  isActive: boolean;
  isTermsAccepted: boolean;
  isVerified: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
