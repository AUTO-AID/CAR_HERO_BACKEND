import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IJwtPayload } from '../interfaces';
export declare class TokenUtil {
    static generateTokens(payload: IJwtPayload, jwtService: JwtService, configService: ConfigService): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    static verifyRefreshToken(token: string, jwtService: JwtService, configService: ConfigService): Promise<IJwtPayload>;
}
