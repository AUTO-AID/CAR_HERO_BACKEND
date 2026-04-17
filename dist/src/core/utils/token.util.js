"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenUtil = void 0;
class TokenUtil {
    static async generateTokens(payload, jwtService, configService) {
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
    static async verifyRefreshToken(token, jwtService, configService) {
        return jwtService.verifyAsync(token, {
            secret: configService.get('JWT_REFRESH_SECRET'),
        });
    }
}
exports.TokenUtil = TokenUtil;
//# sourceMappingURL=token.util.js.map