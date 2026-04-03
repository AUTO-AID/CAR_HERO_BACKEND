import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => {
  const secret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  // التحقق من وجود الـ secrets في production
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret === 'your-secret-key') {
      throw new Error('❌ JWT_SECRET must be set in production environment');
    }
    if (!refreshSecret || refreshSecret === 'changeme-refresh') {
      throw new Error('❌ JWT_REFRESH_SECRET must be set in production environment');
    }
  }

  return {
    // Access Token
    secret: secret || 'dev-secret-key-DO-NOT-USE-IN-PRODUCTION',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m', // توصية: 15 دقيقة للـ access token
    
    // Refresh Token
    refreshSecret: refreshSecret || 'dev-refresh-secret-DO-NOT-USE-IN-PRODUCTION',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    
    // Additional Options
    algorithm: (process.env.JWT_ALGORITHM || 'HS256') as 'HS256' | 'HS384' | 'HS512' | 'RS256',
    issuer: process.env.JWT_ISSUER || 'carhero-api',
    audience: process.env.JWT_AUDIENCE || 'carhero-app',
    
    // Token Options
    ignoreExpiration: false,
    verifyOptions: {
      clockTolerance: parseInt(process.env.JWT_CLOCK_TOLERANCE || '0', 10),
      maxAge: process.env.JWT_MAX_AGE || '7d',
    },
  };
});