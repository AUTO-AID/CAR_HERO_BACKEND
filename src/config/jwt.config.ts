/**
 * JWT Configuration
 * Configuration for access and refresh tokens
 */
import { ConfigService } from '@nestjs/config';
import { JwtModuleAsyncOptions } from '@nestjs/jwt';

export const jwtConfig: JwtModuleAsyncOptions = {
  useFactory: async (configService: ConfigService) => ({
    secret: configService.getOrThrow<string>('JWT_SECRET'),
    signOptions: {
      expiresIn: (configService.get<string>('jwt.expiresIn') || '15m') as any,
    },
  }),
  inject: [ConfigService],
};

/**
 * Get refresh token configuration
 */
export const getRefreshTokenConfig = (configService: ConfigService) => ({
  secret: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
  expiresIn: configService.get<string>('jwt.refreshExpiresIn'),
});
