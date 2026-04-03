/**
 * Admin Module
 * Dashboard and administrative functions
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Admin, AdminSchema } from '../../database/schemas/admin.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Admin.name, schema: AdminSchema }]),
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class AdminModule {}
