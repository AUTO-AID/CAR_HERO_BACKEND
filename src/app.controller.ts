import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Public } from './core/decorators/public.decorator';
import { Roles } from './core/decorators/roles.decorator';
import { RolesGuard } from './core/guards/roles.guard';
import { Role } from './core/enums/roles.enum';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('system/schemas')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  getSchemas() {
    const models = this.connection.modelNames();
    return models.map((modelName) => {
      const model = this.connection.model(modelName);
      const schema = model.schema;

      // Extract fields and types
      const fields: any[] = [];
      Object.entries(schema.paths).forEach(([pathName, pathType]) => {
        const type = (pathType as any).instance || 'Mixed';
        fields.push([
          pathName,
          type,
          (pathType as any).options?.description || '',
        ]);
      });

      // Extract indexes
      const indexes = schema.indexes().map((idx) => {
        return Object.keys(idx[0])
          .map((k) => `${k}_${idx[0][k]}`)
          .join('_');
      });

      // Determine feature module mapping
      const featureMap: Record<string, string> = {
        users: 'users',
        admins: 'admin',
        audit_logs: 'admin',
        providers: 'providers',
        services: 'services',
        vehicles: 'vehicles',
        maintenancerecords: 'vehicles',
        vehiclereminders: 'vehicles',
        orders: 'orders',
        status_histories: 'orders',
        wallets: 'wallet',
        transactions: 'wallet',
        subscription_plans: 'subscriptions',
        user_subscriptions: 'subscriptions',
        chats: 'chat',
        messages: 'chat',
        notifications: 'notifications',
        reviews: 'reviews',
        settings: 'admin',
        pending_registrations: 'providers',
        logouts: 'auth',
      };
      
      const collectionName = model.collection.name;
      const feature = featureMap[collectionName] || 'general';

      return {
        collection: collectionName,
        model: modelName,
        feature,
        status: 'active',
        fields,
        indexes,
        source: `src/modules/${feature}/infrastructure/persistence/mongoose/schemas/${collectionName}.schema.ts`,
      };
    });
  }
}
