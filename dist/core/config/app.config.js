"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appConfig = void 0;
const config_1 = require("@nestjs/config");
exports.appConfig = (0, config_1.registerAs)('app', () => ({
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
//# sourceMappingURL=app.config.js.map