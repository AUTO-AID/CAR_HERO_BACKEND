import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditLog, AuditLogSchema } from './infrastructure/persistence/mongoose/schemas/audit-log.schema';
import { AuditLogService } from './application/services/audit-log.service';
import { AuditLogController } from './presentation/controllers/audit-log.controller';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: AuditLog.name, schema: AuditLogSchema }]),
  ],
  controllers: [AuditLogController],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditModule {}
