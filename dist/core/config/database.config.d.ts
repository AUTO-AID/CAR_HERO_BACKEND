import { MongooseModuleAsyncOptions } from '@nestjs/mongoose';
export declare const databaseConfig: (() => {
    uri: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    uri: string;
}>;
export declare const databaseAsyncOptions: MongooseModuleAsyncOptions;
