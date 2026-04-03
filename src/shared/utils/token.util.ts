import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IJwtPayload } from '../interfaces';

export class TokenUtil {
  static async generateTokens(
    payload: IJwtPayload,
    jwtService: JwtService,
    configService: ConfigService,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      jwtService.signAsync(payload, {
        secret: configService.get('JWT_SECRET'),
        expiresIn: configService.get('JWT_EXPIRES_IN'),
      }),
      jwtService.signAsync(payload, {
        secret: configService.get('JWT_REFRESH_SECRET'),
        expiresIn: configService.get('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);
    return { accessToken, refreshToken };
  }

  static async verifyRefreshToken(
    token: string,
    jwtService: JwtService,
    configService: ConfigService,
  ): Promise<IJwtPayload> {
    return jwtService.verifyAsync(token, {
      secret: configService.get('JWT_REFRESH_SECRET'),
    });
  }
}

