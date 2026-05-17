/**
 * Main Entry Point
 * Bootstrap the NestJS application
 */
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';
import { join } from 'path';
import helmet from 'helmet';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create NestJS application
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Setup EJS for Views (WhatsApp QR)
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('ejs');

  // Serve Static Assets (Chat Uploads)
  const uploadsPath = join(__dirname, '..', 'uploads', 'chat');
  if (!existsSync(uploadsPath)) {
    mkdirSync(uploadsPath, { recursive: true });
  }
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/chat',
  });

  // Security - Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );

  // Get configuration service
  const configService = app.get(ConfigService);

  // Get environment variables
  const port = configService.get<number>('app.port') || 3000;
  const nodeEnv = configService.get<string>('app.nodeEnv') || 'development';
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api/v1';

  // Enable CORS
  app.enableCors({
    origin: '*', // Configure appropriately for production
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Set global prefix
  app.setGlobalPrefix(apiPrefix);

  // Setup Swagger documentation
  setupSwagger(app);

  // Start the server
  await app.listen(port);

  logger.log(`🚗 Car Hero Backend is running on: http://localhost:${port}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
  logger.log(`📄 API OpenAPI JSON: http://localhost:${port}/api-docs-json`);
  logger.log(`🌍 Environment: ${nodeEnv}`);
  logger.log(`🔧 API Prefix: ${apiPrefix}`);
}

bootstrap();
