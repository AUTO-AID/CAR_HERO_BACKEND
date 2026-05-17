import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  StatusHistory,
  StatusHistorySchema,
} from './infrastructure/persistence/mongoose/schemas/status-history.schema';
import { StatusHistoryService } from './application/services/status-history.service';
import { StatusHistoryController } from './presentation/controllers/status-history.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: StatusHistory.name, schema: StatusHistorySchema }]),
  ],
  controllers: [StatusHistoryController],
  providers: [StatusHistoryService],
  exports: [StatusHistoryService],
})
export class StatusHistoryModule {}
