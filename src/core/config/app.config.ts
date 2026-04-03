import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  name: process.env.APP_NAME || 'CarHero API',
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: 'api/v1',
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '10', 10),
  },
  otp: {
    length: 6,
    expiresIn: 5 * 60 * 1000,
    maxAttempts: 3,
  },
}));

