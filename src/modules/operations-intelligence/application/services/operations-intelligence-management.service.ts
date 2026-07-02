import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import { NotificationType } from '../../../../core/enums/status.enum';
import { NotificationsService } from '../../../notifications/application/services/notifications.service';
import { Admin, AdminDocument } from '../../../admin/infrastructure/persistence/mongoose/schemas/admin.schema';
import { OperationsIntelligenceQuery, OperationsIntelligenceService } from './operations-intelligence.service';
import {
  OperationalAlert,
  OperationalAlertDocument,
} from '../../infrastructure/persistence/mongoose/schemas/operational-alert.schema';
import {
  OperationalRecommendation,
  OperationalRecommendationDocument,
} from '../../infrastructure/persistence/mongoose/schemas/operational-recommendation.schema';

type ListQuery = {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  severity?: string;
  type?: string;
  city?: string;
  serviceId?: string;
};

const RECOMMENDATION_STATUSES = ['new', 'acknowledged', 'in_progress', 'resolved', 'dismissed'];
const OPEN_RECOMMENDATION_STATUSES = ['new', 'acknowledged', 'in_progress'];
const SLA_HOURS_BY_PRIORITY: Record<string, number> = {
  critical: 24,
  high: 72,
  medium: 168,
  low: 336,
};
const DUE_SOON_HOURS = 12;

@Injectable()
export class OperationsIntelligenceManagementService {
  private readonly logger = new Logger(OperationsIntelligenceManagementService.name);

  constructor(
    private readonly operationsIntelligenceService: OperationsIntelligenceService,
    @InjectModel(OperationalRecommendation.name)
    private readonly recommendationModel: Model<OperationalRecommendationDocument>,
    @InjectModel(OperationalAlert.name)
    private readonly alertModel: Model<OperationalAlertDocument>,
    @InjectModel(Admin.name)
    private readonly adminModel: Model<AdminDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async runScan(query: OperationsIntelligenceQuery = {}) {
    const preview = await this.operationsIntelligenceService.getPreview(query);
    const now = new Date();
    const savedRecommendations: OperationalRecommendationDocument[] = [];
    const savedAlerts: OperationalAlertDocument[] = [];

    for (const recommendation of preview.recommendations as any[]) {
      const saved = await this.upsertRecommendation(recommendation, now, preview.meta);
      savedRecommendations.push(saved);

      if (['high', 'critical'].includes(saved.priority) && !['resolved', 'dismissed'].includes(saved.status)) {
        const alert = await this.upsertRecommendationAlert(saved, now);
        savedAlerts.push(alert);
      }
    }

    for (const provider of preview.providerWorkload as any[]) {
      if (provider.workloadLevel === 'overloaded' || provider.workloadLevel === 'risky') {
        const alert = await this.upsertProviderAlert(provider, now);
        savedAlerts.push(alert);
      }
    }

    const overdueAlerts = await this.escalateOverdueRecommendations(now);
    savedAlerts.push(...overdueAlerts);

    const dailyBrief = await this.createDailyBrief(now);
    if (dailyBrief) savedAlerts.push(dailyBrief);

    const notifyAlerts = savedAlerts.filter((alert) => ['high', 'critical'].includes(alert.severity) && !alert.notificationSentAt);
    if (notifyAlerts.length > 0) {
      await this.notifyAdminManagers(notifyAlerts);
    }

    return {
      preview,
      scan: {
        scannedAt: now,
        recommendationsSaved: savedRecommendations.length,
        alertsSaved: savedAlerts.length,
        overdueAlerts: overdueAlerts.length,
        criticalAlerts: savedAlerts.filter((alert) => alert.severity === 'critical').length,
        dailyBriefCreated: Boolean(dailyBrief),
      },
    };
  }

  async listRecommendations(query: ListQuery = {}) {
    await this.refreshOpenRecommendationSla();
    const { page, limit, skip } = this.pagination(query);
    const match = this.buildRecommendationMatch(query);
    const [items, total, stats] = await Promise.all([
      this.recommendationModel.find(match).sort({ priority: 1, detectedAt: -1 }).skip(skip).limit(limit).lean().exec(),
      this.recommendationModel.countDocuments(match),
      this.recommendationModel.aggregate([
        { $match: match },
        {
          $facet: {
            byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
            byPriority: [{ $group: { _id: '$priority', count: { $sum: 1 } } }],
          },
        },
      ]).exec(),
    ]);

    return {
      recommendations: items,
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
      stats: stats[0] || { byStatus: [], byPriority: [] },
    };
  }

  async updateRecommendationStatus(id: string, status: string, note?: string, admin?: any) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Recommendation not found');
    if (!RECOMMENDATION_STATUSES.includes(status)) throw new BadRequestException('Invalid recommendation status');

    const now = new Date();
    const update: any = { status };
    const adminId = this.adminObjectId(admin);
    if (status === 'acknowledged') update.acknowledgedAt = now;
    if (status === 'resolved') {
      update.resolvedAt = now;
      update.resolvedBy = adminId;
      update.resolutionNote = note?.trim();
      update.slaStatus = 'on_track';
    }
    if (status === 'dismissed') update.dismissedAt = now;
    if (status === 'in_progress' && !update.acknowledgedAt) update.acknowledgedAt = now;

    const push = note?.trim()
      ? {
          notes: {
            admin: adminId,
            adminName: admin?.name || admin?.email,
            text: note.trim(),
            createdAt: now,
          },
        }
      : undefined;

    const recommendation = await this.recommendationModel.findByIdAndUpdate(
      id,
      push ? { $set: update, $push: push } : { $set: update },
      { new: true },
    ).exec();
    if (!recommendation) throw new NotFoundException('Recommendation not found');

    if (status === 'resolved' || status === 'dismissed') {
      await this.alertModel.updateMany(
        { recommendation: recommendation._id, status: { $ne: 'resolved' } },
        { $set: { status: 'resolved', resolvedAt: now } },
      ).exec();
    }

    return recommendation;
  }

  async addRecommendationNote(id: string, note: string, admin?: any) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Recommendation not found');
    if (!note?.trim()) throw new BadRequestException('Note is required');

    const recommendation = await this.recommendationModel.findByIdAndUpdate(
      id,
      {
        $push: {
          notes: {
            admin: this.adminObjectId(admin),
            adminName: admin?.name || admin?.email,
            text: note.trim(),
            createdAt: new Date(),
          },
        },
      },
      { new: true },
    ).exec();
    if (!recommendation) throw new NotFoundException('Recommendation not found');
    return recommendation;
  }

  async assignRecommendation(id: string, body: { assignedToAdmin?: string; dueAt?: string; note?: string } = {}, admin?: any) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Recommendation not found');

    const now = new Date();
    const update: any = {};
    if (body.assignedToAdmin && Types.ObjectId.isValid(body.assignedToAdmin)) {
      update.assignedToAdmin = new Types.ObjectId(body.assignedToAdmin);
      update.assignedAt = now;
      if (body.assignedToAdmin === String(this.adminObjectId(admin))) update.acknowledgedAt = now;
    }
    if (body.dueAt) {
      const dueAt = new Date(body.dueAt);
      if (Number.isNaN(dueAt.getTime())) throw new BadRequestException('Invalid dueAt date');
      update.dueAt = dueAt;
      update.slaStatus = this.slaStatusFor(undefined, dueAt, now);
    }

    const push = body.note?.trim()
      ? {
          notes: {
            admin: this.adminObjectId(admin),
            adminName: admin?.name || admin?.email,
            text: body.note.trim(),
            createdAt: now,
          },
        }
      : undefined;

    const recommendation = await this.recommendationModel.findByIdAndUpdate(
      id,
      push ? { $set: update, $push: push } : { $set: update },
      { new: true },
    ).exec();
    if (!recommendation) throw new NotFoundException('Recommendation not found');
    return recommendation;
  }

  async listAlerts(query: ListQuery = {}) {
    const { page, limit, skip } = this.pagination(query);
    const match = this.buildAlertMatch(query);
    const [items, total, unread] = await Promise.all([
      this.alertModel.find(match).sort({ severity: 1, detectedAt: -1 }).skip(skip).limit(limit).lean().exec(),
      this.alertModel.countDocuments(match),
      this.alertModel.countDocuments({ status: 'unread' }),
    ]);

    return {
      alerts: items,
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
      stats: { unread },
    };
  }

  async markAlertRead(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Alert not found');
    const alert = await this.alertModel.findByIdAndUpdate(
      id,
      { $set: { status: 'read', readAt: new Date() } },
      { new: true },
    ).exec();
    if (!alert) throw new NotFoundException('Alert not found');
    return alert;
  }

  async resolveAlert(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Alert not found');
    const alert = await this.alertModel.findByIdAndUpdate(
      id,
      { $set: { status: 'resolved', resolvedAt: new Date() } },
      { new: true },
    ).exec();
    if (!alert) throw new NotFoundException('Alert not found');
    return alert;
  }

  @Cron('0 8 * * *')
  async runDailyScan() {
    try {
      const result = await this.runScan({ days: 14, previousDays: 14, limit: 50 });
      this.logger.log(`Daily operations scan completed: ${result.scan.recommendationsSaved} recommendations, ${result.scan.alertsSaved} alerts`);
    } catch (error) {
      this.logger.error(`Daily operations scan failed: ${error.message}`, error.stack);
    }
  }

  private async upsertRecommendation(source: any, now: Date, meta: any) {
    const dedupeKey = [
      source.type,
      source.city || 'unknown',
      source.governorate || source.city || 'unknown',
      source.serviceId || 'unknown',
    ].join(':').toLowerCase();

    const serviceObjectId = Types.ObjectId.isValid(source.serviceId) ? new Types.ObjectId(source.serviceId) : undefined;
    const update = {
      dedupeKey,
      type: source.type,
      priority: source.priority,
      city: source.city,
      governorate: source.governorate,
      service: serviceObjectId,
      serviceName: source.serviceName,
      title: this.recommendationTitle(source),
      summary: this.recommendationSummary(source),
      reason: source.reason,
      reasons: source.reasons || [],
      recommendedProviders: source.recommendedProviders || 0,
      evidence: source.evidence || {},
      lastSeenAt: now,
      metadata: {
        source: 'operations_intelligence_scan',
        previewWindow: meta?.window,
      },
    };

    return this.recommendationModel.findOneAndUpdate(
      { dedupeKey },
      {
        $set: update,
        $setOnInsert: {
          detectedAt: now,
          status: 'new',
          dueAt: this.dueAtFor(source.priority, now),
          slaStatus: 'on_track',
        },
      },
      { new: true, upsert: true },
    ).exec();
  }

  private async upsertRecommendationAlert(recommendation: OperationalRecommendationDocument, now: Date) {
    const severity = recommendation.priority === 'critical' ? 'critical' : 'high';
    const dedupeKey = `recommendation:${recommendation.dedupeKey}`;
    return this.alertModel.findOneAndUpdate(
      { dedupeKey },
      {
        $set: {
          dedupeKey,
          type: recommendation.priority === 'critical' ? 'pressure_critical' : 'coverage_gap',
          severity,
          title: recommendation.title,
          message: recommendation.summary,
          city: recommendation.city,
          governorate: recommendation.governorate,
          service: recommendation.service,
          recommendation: recommendation._id,
          evidence: recommendation.evidence,
          lastSeenAt: now,
        },
        $setOnInsert: { detectedAt: now, status: 'unread' },
      },
      { new: true, upsert: true },
    ).exec();
  }

  private async upsertProviderAlert(provider: any, now: Date) {
    const isRisky = provider.workloadLevel === 'risky';
    const providerId = Types.ObjectId.isValid(provider.providerId) ? new Types.ObjectId(provider.providerId) : undefined;
    const dedupeKey = `provider:${provider.workloadLevel}:${provider.providerId}`;
    return this.alertModel.findOneAndUpdate(
      { dedupeKey },
      {
        $set: {
          dedupeKey,
          type: isRisky ? 'provider_risky' : 'provider_overloaded',
          severity: isRisky ? 'high' : 'warning',
          title: isRisky ? `Provider risk detected: ${provider.businessName}` : `Provider workload rising: ${provider.businessName}`,
          message: (provider.reasons || []).join('. '),
          city: provider.city,
          governorate: provider.governorate,
          provider: providerId,
          evidence: provider,
          lastSeenAt: now,
        },
        $setOnInsert: { detectedAt: now, status: 'unread' },
      },
      { new: true, upsert: true },
    ).exec();
  }

  private async notifyAdminManagers(alerts: OperationalAlertDocument[]) {
    const notifyAlerts = alerts.filter((alert) => !alert.notificationSentAt);
    if (notifyAlerts.length === 0) return;

    const admins = await this.adminModel
      .find({
        isActive: { $ne: false },
        permissions: { $in: ['*', 'all', 'analytics.read', 'operations.manage'] },
      })
      .select('_id')
      .lean()
      .exec();

    await Promise.allSettled(admins.flatMap((admin: any) =>
      notifyAlerts.map((alert) => this.notificationsService.createNotification({
        recipientId: admin._id.toString(),
        recipientType: 'admin',
        title: alert.title,
        body: alert.message,
        type: NotificationType.ALERT,
        data: {
          source: 'operations_intelligence',
          alertId: alert._id.toString(),
          recommendationId: alert.recommendation?.toString(),
        },
      })),
    ));

    await this.alertModel.updateMany(
      { _id: { $in: notifyAlerts.map((alert) => alert._id) } },
      { $set: { notificationSentAt: new Date() } },
    ).exec();
  }

  private async refreshOpenRecommendationSla(now = new Date()) {
    const openRecommendations = await this.recommendationModel
      .find({ status: { $in: OPEN_RECOMMENDATION_STATUSES } })
      .select('_id priority detectedAt dueAt slaStatus')
      .exec();

    await Promise.all(openRecommendations.map((recommendation) => {
      const dueAt = recommendation.dueAt || this.dueAtFor(recommendation.priority, recommendation.detectedAt || now);
      const slaStatus = this.slaStatusFor(recommendation.status, dueAt, now);
      if (recommendation.dueAt && recommendation.slaStatus === slaStatus) return Promise.resolve(recommendation);

      return this.recommendationModel.findByIdAndUpdate(
        recommendation._id,
        { $set: { dueAt, slaStatus } },
        { new: true },
      ).exec();
    }));
  }

  private async escalateOverdueRecommendations(now: Date) {
    await this.refreshOpenRecommendationSla(now);
    const overdueRecommendations = await this.recommendationModel
      .find({
        status: { $in: OPEN_RECOMMENDATION_STATUSES },
        dueAt: { $lte: now },
      })
      .exec();

    const alerts: OperationalAlertDocument[] = [];
    for (const recommendation of overdueRecommendations) {
      const alert = await this.alertModel.findOneAndUpdate(
        { dedupeKey: `recommendation_overdue:${recommendation._id}` },
        {
          $set: {
            dedupeKey: `recommendation_overdue:${recommendation._id}`,
            type: 'recommendation_overdue',
            severity: recommendation.priority === 'critical' ? 'critical' : 'high',
            title: `Overdue follow-up: ${recommendation.title}`,
            message: `Recommendation for ${recommendation.city || 'unknown area'} passed its follow-up deadline.`,
            city: recommendation.city,
            governorate: recommendation.governorate,
            service: recommendation.service,
            recommendation: recommendation._id,
            evidence: {
              priority: recommendation.priority,
              dueAt: recommendation.dueAt,
              serviceName: recommendation.serviceName,
              recommendedProviders: recommendation.recommendedProviders,
            },
            lastSeenAt: now,
          },
          $setOnInsert: { detectedAt: now, status: 'unread' },
        },
        { new: true, upsert: true },
      ).exec();
      alerts.push(alert);
    }

    return alerts;
  }

  private async createDailyBrief(now: Date) {
    const dayKey = now.toISOString().slice(0, 10);
    const [openCount, overdueCount, criticalCount, unreadAlerts] = await Promise.all([
      this.recommendationModel.countDocuments({ status: { $in: OPEN_RECOMMENDATION_STATUSES } }),
      this.recommendationModel.countDocuments({ status: { $in: OPEN_RECOMMENDATION_STATUSES }, slaStatus: 'overdue' }),
      this.recommendationModel.countDocuments({ status: { $in: OPEN_RECOMMENDATION_STATUSES }, priority: 'critical' }),
      this.alertModel.countDocuments({ status: 'unread' }),
    ]);

    if (openCount === 0 && unreadAlerts === 0) return null;

    return this.alertModel.findOneAndUpdate(
      { dedupeKey: `daily_brief:${dayKey}` },
      {
        $setOnInsert: {
          dedupeKey: `daily_brief:${dayKey}`,
          type: 'daily_brief',
          severity: overdueCount > 0 || criticalCount > 0 ? 'high' : 'info',
          status: 'unread',
          title: 'Daily operations intelligence brief',
          message: `Open recommendations: ${openCount}. Overdue: ${overdueCount}. Critical: ${criticalCount}. Unread alerts: ${unreadAlerts}.`,
          evidence: { openCount, overdueCount, criticalCount, unreadAlerts, dayKey },
          detectedAt: now,
          lastSeenAt: now,
        },
      },
      { new: true, upsert: true },
    ).exec();
  }

  private dueAtFor(priority: string, start: Date) {
    const hours = SLA_HOURS_BY_PRIORITY[priority] || SLA_HOURS_BY_PRIORITY.medium;
    return new Date(start.getTime() + hours * 60 * 60 * 1000);
  }

  private slaStatusFor(status: string | undefined, dueAt: Date, now = new Date()) {
    if (status && !OPEN_RECOMMENDATION_STATUSES.includes(status)) return 'on_track';
    const remainingMs = dueAt.getTime() - now.getTime();
    if (remainingMs <= 0) return 'overdue';
    if (remainingMs <= DUE_SOON_HOURS * 60 * 60 * 1000) return 'due_soon';
    return 'on_track';
  }

  private recommendationTitle(source: any) {
    if (source.type === 'provider_recruitment') {
      return `Recruit ${source.recommendedProviders || 1} providers for ${source.serviceName} in ${source.city || 'unknown area'}`;
    }
    return `Operational recommendation for ${source.city || 'unknown area'}`;
  }

  private recommendationSummary(source: any) {
    const evidence = source.evidence || {};
    return [
      `${source.serviceName || 'Service'} demand in ${source.city || 'unknown area'} reached pressure score ${evidence.pressureScore ?? 'n/a'}.`,
      `Orders: ${evidence.ordersCount ?? 0}, active providers: ${evidence.activeProviders ?? 0}.`,
      `Recommended action: add ${source.recommendedProviders || 1} provider(s).`,
    ].join(' ');
  }

  private buildRecommendationMatch(query: ListQuery) {
    const match: any = {};
    if (query.status && query.status !== 'all') match.status = query.status;
    if (query.priority && query.priority !== 'all') match.priority = query.priority;
    if (query.type && query.type !== 'all') match.type = query.type;
    if (query.city && query.city !== 'all') match.city = new RegExp(this.escapeRegex(query.city), 'i');
    if (query.serviceId && Types.ObjectId.isValid(query.serviceId)) match.service = new Types.ObjectId(query.serviceId);
    return match;
  }

  private buildAlertMatch(query: ListQuery) {
    const match: any = {};
    if (query.status && query.status !== 'all') match.status = query.status;
    if (query.severity && query.severity !== 'all') match.severity = query.severity;
    if (query.type && query.type !== 'all') match.type = query.type;
    if (query.city && query.city !== 'all') match.city = new RegExp(this.escapeRegex(query.city), 'i');
    if (query.serviceId && Types.ObjectId.isValid(query.serviceId)) match.service = new Types.ObjectId(query.serviceId);
    return match;
  }

  private pagination(query: ListQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    return { page, limit, skip: (page - 1) * limit };
  }

  private adminObjectId(admin: any) {
    const id = admin?._id || admin?.userId || admin?.id;
    return id && Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : undefined;
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
