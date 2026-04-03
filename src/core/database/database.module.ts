import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { databaseAsyncOptions } from '../config';

@Module({
  imports: [ConfigModule, MongooseModule.forRootAsync(databaseAsyncOptions)],
})
export class DatabaseModule {}

