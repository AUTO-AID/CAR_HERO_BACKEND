import { registerAs, ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModuleAsyncOptions } from '@nestjs/mongoose';

export const databaseConfig = registerAs('database', () => ({
  uri:
    process.env.DATABASE_URI ||
    'mongodb+srv://mohammednatheerayyan_db_user:ZmgEwVkxTMRJyBs0@cluster0.jlurjt6.mongodb.net/carHero',
}));

export const databaseAsyncOptions: MongooseModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => ({
    uri:
      configService.get<string>('DATABASE_URI') ||
      configService.get<string>('database.uri'),
    dbName: configService.get<string>('database.name'),
    // Attach connection event listeners so the app logs success/failure
    connectionFactory: (connection) => {
      connection.on('connected', () =>
        console.log('MongoDB connection established')
      );
      connection.on('error', (err) =>
        console.error('MongoDB connection error:', err.message || err)
      );
      connection.on('disconnected', () =>
        console.warn('MongoDB disconnected')
      );
      return connection;
    },
  }),
};
