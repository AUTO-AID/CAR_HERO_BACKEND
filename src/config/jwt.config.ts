/**
 * JWT Configuration
 * Configuration for access and refresh tokens
 */
import { ConfigService } from '@nestjs/config';
import { JwtModuleAsyncOptions } from '@nestjs/jwt';

export const jwtConfig: JwtModuleAsyncOptions = {
  useFactory: async (configService: ConfigService) => ({
    secret: configService.get<string>('jwt.secret') || 'default-secret',
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
  secret: configService.get<string>('jwt.refreshSecret'),
  expiresIn: configService.get<string>('jwt.refreshExpiresIn'),
});
