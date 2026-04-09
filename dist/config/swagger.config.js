"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = void 0;
const swagger_1 = require("@nestjs/swagger");
const setupSwagger = (app) => {
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Car Hero API')
        .setDescription(`
      Car Hero Backend API Documentation
      
      A comprehensive car services & roadside assistance platform API.
      
      ## Features
      - User authentication (OTP-based)
      - Service provider management
      - Real-time order tracking
      - Chat system
      - Wallet & loyalty points
      - Premium subscriptions
      `)
        .setVersion('1.0')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
    }, 'JWT-auth')
        .addTag('Auth', 'Authentication endpoints')
        .addTag('Users', 'User management endpoints')
        .addTag('Providers', 'Service provider endpoints')
        .addTag('Vehicles', 'Vehicle management endpoints')
        .addTag('Services', 'Service catalog endpoints')
        .addTag('Orders', 'Order management endpoints')
        .addTag('Bookings', 'Booking management endpoints')
        .addTag('Chat', 'Chat & messaging endpoints')
        .addTag('Wallet', 'Wallet & transactions endpoints')
        .addTag('Subscriptions', 'Premium subscription endpoints')
        .addTag('Reviews', 'Reviews & ratings endpoints')
        .addTag('Notifications', 'Push notification endpoints')
        .addTag('Admin', 'Admin dashboard endpoints')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            tagsSorter: 'alpha',
            operationsSorter: 'alpha',
        },
        customSiteTitle: 'Car Hero API Documentation',
    });
};
exports.setupSwagger = setupSwagger;
//# sourceMappingURL=swagger.config.js.map