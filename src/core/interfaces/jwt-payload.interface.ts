export interface IJwtPayload {
  userId: string;
  role: string;
  permissions?: string[];
  phoneNumber?: string;
  email?: string;
  accountType?: string;
  isPremium?: boolean;
  providerId?: string;
}

