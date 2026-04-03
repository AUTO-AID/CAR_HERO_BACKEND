import { ConfigService } from '@nestjs/config';
import { JwtModuleAsyncOptions } from '@nestjs/jwt';
export declare const jwtConfig: JwtModuleAsyncOptions;
export declare const getRefreshTokenConfig: (configService: ConfigService) => {
    secret: string | undefined;
    expiresIn: string | undefined;
};
