"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const swagger_config_1 = require("./config/swagger.config");
const path_1 = require("path");
const helmet_1 = __importDefault(require("helmet"));
const fs_1 = require("fs");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    app.setBaseViewsDir((0, path_1.join)(__dirname, '..', 'views'));
    app.setViewEngine('ejs');
    const uploadsPath = (0, path_1.join)(__dirname, '..', 'uploads', 'chat');
    if (!(0, fs_1.existsSync)(uploadsPath)) {
        (0, fs_1.mkdirSync)(uploadsPath, { recursive: true });
    }
    app.useStaticAssets(uploadsPath, {
        prefix: '/uploads/chat',
    });
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: false,
    }));
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('app.port') || 3000;
    const nodeEnv = configService.get('app.nodeEnv') || 'development';
    const apiPrefix = configService.get('app.apiPrefix') || 'api/v1';
    app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });
    app.setGlobalPrefix(apiPrefix);
    (0, swagger_config_1.setupSwagger)(app);
    await app.listen(port);
    logger.log(`🚗 Car Hero Backend is running on: http://localhost:${port}`);
    logger.log(`📚 API Documentation: http://localhost:${port}/api`);
    logger.log(`🌍 Environment: ${nodeEnv}`);
    logger.log(`🔧 API Prefix: ${apiPrefix}`);
}
bootstrap();
//# sourceMappingURL=main.js.map