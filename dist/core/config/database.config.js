"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseAsyncOptions = exports.databaseConfig = void 0;
const config_1 = require("@nestjs/config");
exports.databaseConfig = (0, config_1.registerAs)('database', () => ({
    uri: process.env.DATABASE_URI ||
        'mongodb+srv://mohammednatheerayyan_db_user:ZmgEwVkxTMRJyBs0@cluster0.jlurjt6.mongodb.net/carHero',
}));
exports.databaseAsyncOptions = {
    imports: [config_1.ConfigModule],
    inject: [config_1.ConfigService],
    useFactory: async (configService) => ({
        uri: configService.get('DATABASE_URI') ||
            configService.get('database.uri'),
        dbName: configService.get('database.name'),
        connectionFactory: (connection) => {
            connection.on('connected', () => console.log('MongoDB connection established'));
            connection.on('error', (err) => console.error('MongoDB connection error:', err.message || err));
            connection.on('disconnected', () => console.warn('MongoDB disconnected'));
            return connection;
        },
    }),
};
//# sourceMappingURL=database.config.js.map