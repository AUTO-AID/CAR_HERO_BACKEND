import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from '../../infrastructure/persistence/mongoose/schemas/audit-log.schema';

export interface AuditLogInput {
  admin?: string;
  adminEmail?: string;
  adminName?: string;
  action: string;
  entityType: string;
  entityId?: string;
  summary?: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async record(input: AuditLogInput): Promise<AuditLogDocument | null> {
    try {
      const payload: any = {
        ...input,
        before: input.before || {},
        after: input.after || {},
        metadata: input.metadata || {},
      };

      if (input.admin && Types.ObjectId.isValid(input.admin)) {
        payload.admin = new Types.ObjectId(input.admin);
      } else {
        delete payload.admin;
      }

      if (input.entityId && Types.ObjectId.isValid(input.entityId)) {
        payload.entityId = new Types.ObjectId(input.entityId);
      } else {
        delete payload.entityId;
      }

      return await this.auditLogModel.create(payload);
    } catch (error) {
      this.logger.error(`Failed to write audit log for ${input.action}`, error as any);
      return null;
    }
  }

  async findAll(query: {
    action?: string;
    entityType?: string;
    entityId?: string;
    admin?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const filter: any = {};

    if (query.action) filter.action = query.action;
    if (query.entityType) filter.entityType = query.entityType;
    if (query.entityId && Types.ObjectId.isValid(query.entityId)) filter.entityId = query.entityId;
    if (query.admin && Types.ObjectId.isValid(query.admin)) filter.admin = query.admin;

    const [logs, total] = await Promise.all([
      this.auditLogModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.auditLogModel.countDocuments(filter),
    ]);

    return { logs, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findByEntity(entityType: string, entityId: string, page = 1, limit = 20) {
    return this.findAll({ entityType, entityId, page, limit });
  }
}
