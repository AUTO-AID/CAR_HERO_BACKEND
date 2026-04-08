"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRefreshTokenConfig = exports.jwtConfig = void 0;
const config_1 = require("@nestjs/config");
exports.jwtConfig = {
    useFactory: async (configService) => ({
        secret: configService.get('jwt.secret') || 'default-secret',
        signOptions: {
            expiresIn: (configService.get('jwt.expiresIn') || '15m'),
        },
    }),
    inject: [config_1.ConfigService],
};
const getRefreshTokenConfig = (configService) => ({
    secret: configService.get('jwt.refreshSecret'),
    expiresIn: configService.get('jwt.refreshExpiresIn'),
});
exports.getRefreshTokenConfig = getRefreshTokenConfig;
//# sourceMappingURL=jwt.config.js.map