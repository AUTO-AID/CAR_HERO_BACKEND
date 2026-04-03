"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtConfig = void 0;
const config_1 = require("@nestjs/config");
exports.jwtConfig = (0, config_1.registerAs)('jwt', () => {
    const secret = process.env.JWT_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (process.env.NODE_ENV === 'production') {
        if (!secret || secret === 'your-secret-key') {
            throw new Error('❌ JWT_SECRET must be set in production environment');
        }
        if (!refreshSecret || refreshSecret === 'changeme-refresh') {
            throw new Error('❌ JWT_REFRESH_SECRET must be set in production environment');
        }
    }
    return {
        secret: secret || 'dev-secret-key-DO-NOT-USE-IN-PRODUCTION',
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        refreshSecret: refreshSecret || 'dev-refresh-secret-DO-NOT-USE-IN-PRODUCTION',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        algorithm: (process.env.JWT_ALGORITHM || 'HS256'),
        issuer: process.env.JWT_ISSUER || 'carhero-api',
        audience: process.env.JWT_AUDIENCE || 'carhero-app',
        ignoreExpiration: false,
        verifyOptions: {
            clockTolerance: parseInt(process.env.JWT_CLOCK_TOLERANCE || '0', 10),
            maxAge: process.env.JWT_MAX_AGE || '7d',
        },
    };
});
//# sourceMappingURL=jwt.config.js.map