import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  StatusHistory,
  StatusHistoryDocument,
} from '../../infrastructure/persistence/mongoose/schemas/status-history.schema';

export interface StatusHistoryInput {
  entityType?: string;
  entityId: string;
  orderNumber?: string;
  fromStatus?: string;
  toStatus: string;
  changedBy?: string;
  changedByRole?: string;
  changedByType?: string;
  reason?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class StatusHistoryService {
  private readonly logger = new Logger(StatusHistoryService.name);

  constructor(
    @InjectModel(StatusHistory.name)
    private readonly statusHistoryModel: Model<StatusHistoryDocument>,
  ) {}

  async record(input: StatusHistoryInput): Promise<StatusHistoryDocument | null> {
    try {
      if (!Types.ObjectId.isValid(input.entityId)) {
        return null;
      }

      const payload: any = {
        ...input,
        entityType: input.entityType || 'order',
        entityId: new Types.ObjectId(input.entityId),
        metadata: input.metadata || {},
      };

      if (input.changedBy && Types.ObjectId.isValid(input.changedBy)) {
        payload.changedBy = new Types.ObjectId(input.changedBy);
      } else {
        delete payload.changedBy;
      }

      return await this.statusHistoryModel.create(payload);
    } catch (error) {
      this.logger.error(`Failed to write status history for ${input.entityId}`, error as any);
      return null;
    }
  }

  async findAll(query: {
    entityType?: string;
    entityId?: string;
    toStatus?: string;
    changedBy?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const filter: any = {};

    if (query.entityType) filter.entityType = query.entityType;
    if (query.entityId && Types.ObjectId.isValid(query.entityId)) filter.entityId = query.entityId;
    if (query.changedBy && Types.ObjectId.isValid(query.changedBy)) filter.changedBy = query.changedBy;
    if (query.toStatus) filter.toStatus = query.toStatus;

    const [histories, total] = await Promise.all([
      this.statusHistoryModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.statusHistoryModel.countDocuments(filter),
    ]);

    return { histories, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findForEntity(entityType: string, entityId: string) {
    if (!Types.ObjectId.isValid(entityId)) {
      return [];
    }

    return this.statusHistoryModel
      .find({ entityType, entityId })
      .sort({ createdAt: 1 })
      .lean();
  }

  async findForOrder(orderId: string) {
    return this.findForEntity('order', orderId);
  }
}
