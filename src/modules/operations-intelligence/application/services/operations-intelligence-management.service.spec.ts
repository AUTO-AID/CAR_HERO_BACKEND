import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { OperationsIntelligenceManagementService } from './operations-intelligence-management.service';
import { NotificationType } from '../../../../core/enums/status.enum';

function execResult<T>(value: T) {
  return { exec: jest.fn().mockResolvedValue(value) };
}

function chainResult<T>(value: T) {
  return {
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(value),
  };
}

function makeService(overrides: Record<string, any> = {}) {
  const recommendationModel = {
    find: jest.fn().mockReturnValue(chainResult([])),
    findByIdAndUpdate: jest.fn().mockReturnValue(execResult(null)),
    findOneAndUpdate: jest.fn().mockReturnValue(execResult(null)),
    countDocuments: jest.fn().mockResolvedValue(0),
    aggregate: jest.fn().mockReturnValue(execResult([{ byStatus: [], byPriority: [] }])),
    ...overrides.recommendationModel,
  };
  const alertModel = {
    find: jest.fn().mockReturnValue(chainResult([])),
    findByIdAndUpdate: jest.fn().mockReturnValue(execResult(null)),
    findOneAndUpdate: jest.fn().mockReturnValue(execResult(null)),
    updateMany: jest.fn().mockReturnValue(execResult({ modifiedCount: 0 })),
    countDocuments: jest.fn().mockResolvedValue(0),
    ...overrides.alertModel,
  };
  const adminModel = {
    find: jest.fn().mockReturnValue(chainResult([])),
    ...overrides.adminModel,
  };
  const notificationsService = {
    createNotification: jest.fn().mockResolvedValue({}),
    ...overrides.notificationsService,
  };

  const service = new OperationsIntelligenceManagementService(
    overrides.operationsIntelligenceService || { getPreview: jest.fn() },
    recommendationModel,
    alertModel,
    adminModel,
    notificationsService,
  );

  return { service: service as any, recommendationModel, alertModel, adminModel, notificationsService };
}

describe('OperationsIntelligenceManagementService follow-up workflow', () => {
  const now = new Date('2026-06-30T09:00:00.000Z');

  it('calculates SLA due dates and statuses by priority', () => {
    const { service } = makeService();

    expect(service.dueAtFor('critical', now).toISOString()).toBe('2026-07-01T09:00:00.000Z');
    expect(service.dueAtFor('high', now).toISOString()).toBe('2026-07-03T09:00:00.000Z');
    expect(service.dueAtFor('medium', now).toISOString()).toBe('2026-07-07T09:00:00.000Z');
    expect(service.dueAtFor('low', now).toISOString()).toBe('2026-07-14T09:00:00.000Z');

    expect(service.slaStatusFor('new', new Date('2026-06-30T10:00:00.000Z'), now)).toBe('due_soon');
    expect(service.slaStatusFor('in_progress', new Date('2026-06-30T08:59:00.000Z'), now)).toBe('overdue');
    expect(service.slaStatusFor('resolved', new Date('2026-06-30T08:59:00.000Z'), now)).toBe('on_track');
  });

  it('creates a high severity daily brief when open work is critical or overdue', async () => {
    const alert = { _id: new Types.ObjectId(), dedupeKey: 'daily_brief:2026-06-30', severity: 'high' };
    const { service, recommendationModel, alertModel } = makeService({
      recommendationModel: {
        countDocuments: jest.fn()
          .mockResolvedValueOnce(3)
          .mockResolvedValueOnce(1)
          .mockResolvedValueOnce(1),
      },
      alertModel: {
        countDocuments: jest.fn().mockResolvedValue(2),
        findOneAndUpdate: jest.fn().mockReturnValue(execResult(alert)),
      },
    });

    const result = await service.createDailyBrief(now);

    expect(result).toBe(alert);
    expect(recommendationModel.countDocuments).toHaveBeenCalledTimes(3);
    expect(alertModel.findOneAndUpdate).toHaveBeenCalledWith(
      { dedupeKey: 'daily_brief:2026-06-30' },
      expect.objectContaining({
        $setOnInsert: expect.objectContaining({
          type: 'daily_brief',
          severity: 'high',
          evidence: expect.objectContaining({ openCount: 3, overdueCount: 1, criticalCount: 1, unreadAlerts: 2 }),
        }),
      }),
      { new: true, upsert: true },
    );
  });

  it('does not create a daily brief when there is no open work or unread alert', async () => {
    const { service, alertModel } = makeService();

    const result = await service.createDailyBrief(now);

    expect(result).toBeNull();
    expect(alertModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('sends admin notifications only for alerts that were not notified before', async () => {
    const newAlertId = new Types.ObjectId();
    const alreadySentAlertId = new Types.ObjectId();
    const adminId = new Types.ObjectId();
    const newAlert = {
      _id: newAlertId,
      title: 'Critical pressure',
      message: 'Homs needs providers',
      recommendation: new Types.ObjectId(),
    };
    const alreadySentAlert = {
      _id: alreadySentAlertId,
      title: 'Already sent',
      message: 'Skip',
      notificationSentAt: now,
    };
    const { service, adminModel, alertModel, notificationsService } = makeService({
      adminModel: {
        find: jest.fn().mockReturnValue(chainResult([{ _id: adminId }])),
      },
      alertModel: {
        updateMany: jest.fn().mockReturnValue(execResult({ modifiedCount: 1 })),
      },
    });

    await service.notifyAdminManagers([newAlert, alreadySentAlert]);

    expect(adminModel.find).toHaveBeenCalled();
    expect(notificationsService.createNotification).toHaveBeenCalledTimes(1);
    expect(notificationsService.createNotification).toHaveBeenCalledWith(expect.objectContaining({
      recipientId: adminId.toString(),
      recipientType: 'admin',
      title: 'Critical pressure',
      type: NotificationType.ALERT,
      data: expect.objectContaining({
        source: 'operations_intelligence',
        alertId: newAlertId.toString(),
      }),
    }));
    expect(alertModel.updateMany).toHaveBeenCalledWith(
      { _id: { $in: [newAlertId] } },
      { $set: { notificationSentAt: expect.any(Date) } },
    );
  });

  it('assigns a recommendation, updates its due date, and stores a follow-up note', async () => {
    const recommendationId = new Types.ObjectId();
    const adminId = new Types.ObjectId();
    const dueAt = new Date('2026-07-01T08:00:00.000Z');
    const savedRecommendation = { _id: recommendationId, assignedToAdmin: adminId };
    const { service, recommendationModel } = makeService({
      recommendationModel: {
        findByIdAndUpdate: jest.fn().mockReturnValue(execResult(savedRecommendation)),
      },
    });

    const result = await service.assignRecommendation(
      recommendationId.toString(),
      { assignedToAdmin: adminId.toString(), dueAt: dueAt.toISOString(), note: 'Call candidates today' },
      { _id: adminId, name: 'Ops Admin' },
    );

    expect(result).toBe(savedRecommendation);
    expect(recommendationModel.findByIdAndUpdate).toHaveBeenCalledWith(
      recommendationId.toString(),
      expect.objectContaining({
        $set: expect.objectContaining({
          assignedToAdmin: expect.any(Types.ObjectId),
          assignedAt: expect.any(Date),
          acknowledgedAt: expect.any(Date),
          dueAt,
          slaStatus: 'on_track',
        }),
        $push: expect.objectContaining({
          notes: expect.objectContaining({
            adminName: 'Ops Admin',
            text: 'Call candidates today',
          }),
        }),
      }),
      { new: true },
    );
  });

  it('rejects invalid recommendation due dates', async () => {
    const { service } = makeService();

    await expect(service.assignRecommendation(
      new Types.ObjectId().toString(),
      { dueAt: 'not-a-date' },
      {},
    )).rejects.toBeInstanceOf(BadRequestException);
  });

  it('resolving a recommendation stores resolution data and resolves related alerts', async () => {
    const recommendationId = new Types.ObjectId();
    const adminId = new Types.ObjectId();
    const savedRecommendation = { _id: recommendationId, status: 'resolved' };
    const { service, recommendationModel, alertModel } = makeService({
      recommendationModel: {
        findByIdAndUpdate: jest.fn().mockReturnValue(execResult(savedRecommendation)),
      },
      alertModel: {
        updateMany: jest.fn().mockReturnValue(execResult({ modifiedCount: 2 })),
      },
    });

    const result = await service.updateRecommendationStatus(
      recommendationId.toString(),
      'resolved',
      'Hired two providers',
      { _id: adminId, email: 'ops@carhero.test' },
    );

    expect(result).toBe(savedRecommendation);
    expect(recommendationModel.findByIdAndUpdate).toHaveBeenCalledWith(
      recommendationId.toString(),
      expect.objectContaining({
        $set: expect.objectContaining({
          status: 'resolved',
          resolvedAt: expect.any(Date),
          resolvedBy: expect.any(Types.ObjectId),
          resolutionNote: 'Hired two providers',
          slaStatus: 'on_track',
        }),
        $push: expect.objectContaining({
          notes: expect.objectContaining({ text: 'Hired two providers' }),
        }),
      }),
      { new: true },
    );
    expect(alertModel.updateMany).toHaveBeenCalledWith(
      { recommendation: recommendationId, status: { $ne: 'resolved' } },
      { $set: { status: 'resolved', resolvedAt: expect.any(Date) } },
    );
  });
});
