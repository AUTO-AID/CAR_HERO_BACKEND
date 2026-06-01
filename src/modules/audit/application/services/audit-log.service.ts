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
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const filter: any = {};

    if (query.action) filter.action = query.action;
    if (query.entityType) filter.entityType = query.entityType;
    if (query.entityId && Types.ObjectId.isValid(query.entityId)) filter.entityId = query.entityId;
    if (query.admin && Types.ObjectId.isValid(query.admin)) filter.admin = query.admin;
    if (query.search?.trim()) {
      const search = query.search.trim();
      const regex = new RegExp(this.escapeRegex(search), 'i');
      filter.$or = [
        { adminName: regex },
        { adminEmail: regex },
        { action: regex },
        { entityType: regex },
        { summary: regex },
      ];
      if (Types.ObjectId.isValid(search)) {
        filter.$or.push({ entityId: new Types.ObjectId(search) });
      }
    }
    if (query.dateFrom || query.dateTo) {
      filter.createdAt = {};
      if (query.dateFrom && !Number.isNaN(Date.parse(query.dateFrom))) filter.createdAt.$gte = new Date(`${query.dateFrom}T00:00:00.000Z`);
      if (query.dateTo && !Number.isNaN(Date.parse(query.dateTo))) filter.createdAt.$lte = new Date(`${query.dateTo}T23:59:59.999Z`);
      if (!Object.keys(filter.createdAt).length) delete filter.createdAt;
    }
    const sortDirection = query.sortOrder === 'asc' ? 1 : -1;

    const [logs, total] = await Promise.all([
      this.auditLogModel.find(filter).sort({ createdAt: sortDirection }).skip((page - 1) * limit).limit(limit).lean(),
      this.auditLogModel.countDocuments(filter),
    ]);

    return { logs, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
  }

  async findByEntity(entityType: string, entityId: string, page = 1, limit = 20) {
    return this.findAll({ entityType, entityId, page, limit });
  }

  async getStats() {
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const weekAgo = new Date(today);
    weekAgo.setUTCDate(weekAgo.getUTCDate() - 6);
    const [total, todayCount, weekCount, actions, entities, admins, daily] = await Promise.all([
      this.auditLogModel.countDocuments(),
      this.auditLogModel.countDocuments({ createdAt: { $gte: today } }),
      this.auditLogModel.countDocuments({ createdAt: { $gte: weekAgo } }),
      this.auditLogModel.aggregate([{ $group: { _id: '$action', count: { $sum: 1 } } }, { $sort: { count: -1, _id: 1 } }]),
      this.auditLogModel.aggregate([{ $group: { _id: '$entityType', count: { $sum: 1 } } }, { $sort: { count: -1, _id: 1 } }]),
      this.auditLogModel.aggregate([{ $group: { _id: { id: '$admin', name: '$adminName', email: '$adminEmail' }, count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      this.auditLogModel.aggregate([{ $match: { createdAt: { $gte: weekAgo } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    ]);
    return { total, today: todayCount, week: weekCount, actions, entities, admins, daily };
  }

  async exportCsv(query: Omit<Parameters<AuditLogService['findAll']>[0], 'page' | 'limit'>) {
    const logs: any[] = [];
    let page = 1;
    let total = 0;
    do {
      const result = await this.findAll({ ...query, page, limit: 100 });
      total = result.total;
      logs.push(...result.logs);
      page += 1;
    } while (logs.length < total && logs.length < 5000);
    const headers = ['createdAt', 'adminName', 'adminEmail', 'action', 'entityType', 'entityId', 'summary', 'ipAddress'];
    const rows = logs.slice(0, 5000).map((log: any) => headers.map((header) => this.csvCell(log[header]?.toString() ?? '')).join(','));
    return { filename: `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`, csv: [headers.join(','), ...rows].join('\n'), exported: rows.length, total, truncated: total > rows.length };
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private csvCell(value: string) {
    return `"${value.replace(/"/g, '""')}"`;
  }
}
