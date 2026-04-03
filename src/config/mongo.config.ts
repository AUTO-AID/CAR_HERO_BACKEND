/**
 * MongoDB Configuration
 * Mongoose connection factory for NestJS
 */
import { ConfigService } from '@nestjs/config';
import { MongooseModuleAsyncOptions } from '@nestjs/mongoose';

export const mongoConfig: MongooseModuleAsyncOptions = {
  useFactory: async (configService: ConfigService) => ({
    uri: configService.get<string>('database.uri'),
    // Connection options
    retryWrites: true,
    w: 'majority',
  }),
  inject: [ConfigService],
};
