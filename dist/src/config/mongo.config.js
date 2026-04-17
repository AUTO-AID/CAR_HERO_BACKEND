"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mongoConfig = void 0;
const config_1 = require("@nestjs/config");
exports.mongoConfig = {
    useFactory: async (configService) => ({
        uri: configService.get('database.uri'),
        retryWrites: true,
        w: 'majority',
    }),
    inject: [config_1.ConfigService],
};
//# sourceMappingURL=mongo.config.js.map