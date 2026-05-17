/**
 * Swagger Configuration
 * API documentation setup for Car Hero backend
 */
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export const setupSwagger = (app: INestApplication): void => {
  const config = new DocumentBuilder()
    .setTitle('Car Hero API')
    .setDescription(
      `
      Car Hero Backend API Documentation
      
      A comprehensive car services & roadside assistance platform API.
      
      ## Features
      - User authentication (OTP-based)
      - Service provider management
      - Real-time order tracking
      - Chat system
      - Wallet & loyalty points
      - Premium subscriptions
      `,
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Providers', 'Service provider endpoints')
    .addTag('Vehicles', 'Vehicle management endpoints')
    .addTag('Services', 'Service catalog endpoints')
    .addTag('Orders', 'Order management endpoints')
    .addTag('Chat', 'Chat & messaging endpoints')
    .addTag('Wallet', 'Wallet & transactions endpoints')
    .addTag('Subscriptions', 'Premium subscription endpoints')
    .addTag('Reviews', 'Reviews & ratings endpoints')
    .addTag('Notifications', 'Push notification endpoints')
    .addTag('Admin', 'Admin dashboard endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Car Hero API Documentation',
  });
};
