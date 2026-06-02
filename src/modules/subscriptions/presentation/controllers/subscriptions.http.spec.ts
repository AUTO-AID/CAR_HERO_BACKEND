import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { SubscriptionsController } from './subscriptions.controller';
import { GetSubscriptionPlansUseCase } from '../../application/use-cases/get-subscription-plans.use-case';
import { SubscribeUserUseCase } from '../../application/use-cases/subscribe-user.use-case';
import { CheckSubscriptionStatusUseCase } from '../../application/use-cases/check-subscription-status.use-case';
import { CancelSubscriptionUseCase } from '../../application/use-cases/cancel-subscription.use-case';
import { RenewSubscriptionUseCase } from '../../application/use-cases/renew-subscription.use-case';
import { UpgradeSubscriptionUseCase } from '../../application/use-cases/upgrade-subscription.use-case';
import { GetSubscriptionHistoryUseCase } from '../../application/use-cases/get-subscription-history.use-case';
import { ManageSubscriptionPlansUseCase } from '../../application/use-cases/manage-subscription-plans.use-case';
import { ListSubscriptionsUseCase } from '../../application/use-cases/list-subscriptions.use-case';
import { GetSubscriptionStatsUseCase } from '../../application/use-cases/get-subscription-stats.use-case';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { PermissionsGuard } from '../../../../core/guards/permissions.guard';
import { AuditLogService } from '../../../audit/application/services/audit-log.service';

describe('SubscriptionsController HTTP endpoints', () => {
  let app: INestApplication;
  const useCases = {
    getPlans: { execute: jest.fn().mockResolvedValue([{ id: 'plan-id' }]), findById: jest.fn().mockResolvedValue({ id: 'plan-id' }) },
    subscribe: { execute: jest.fn().mockResolvedValue({ id: 'sub-id' }) },
    status: { execute: jest.fn().mockResolvedValue({ isActive: true }) },
    cancel: { execute: jest.fn().mockResolvedValue({ message: 'cancelled' }) },
    renew: { execute: jest.fn().mockResolvedValue({ id: 'sub-id' }) },
    upgrade: { execute: jest.fn().mockResolvedValue({ id: 'sub-2' }) },
    history: { execute: jest.fn().mockResolvedValue([]) },
    manage: {
      create: jest.fn().mockResolvedValue({ id: 'plan-id' }),
      update: jest.fn().mockResolvedValue({ id: 'plan-id', price: 2 }),
      delete: jest.fn().mockResolvedValue({ message: 'deleted' }),
    },
    list: { execute: jest.fn().mockResolvedValue({ subscriptions: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 } }) },
    stats: { execute: jest.fn().mockResolvedValue({ active: 1, expired: 0, cancelled: 0, pending: 0, revenue: 100 }) },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionsController],
      providers: [
        { provide: GetSubscriptionPlansUseCase, useValue: useCases.getPlans },
        { provide: SubscribeUserUseCase, useValue: useCases.subscribe },
        { provide: CheckSubscriptionStatusUseCase, useValue: useCases.status },
        { provide: CancelSubscriptionUseCase, useValue: useCases.cancel },
        { provide: RenewSubscriptionUseCase, useValue: useCases.renew },
        { provide: UpgradeSubscriptionUseCase, useValue: useCases.upgrade },
        { provide: GetSubscriptionHistoryUseCase, useValue: useCases.history },
        { provide: ManageSubscriptionPlansUseCase, useValue: useCases.manage },
        { provide: ListSubscriptionsUseCase, useValue: useCases.list },
        { provide: GetSubscriptionStatsUseCase, useValue: useCases.stats },
        { provide: AuditLogService, useValue: { record: jest.fn().mockResolvedValue(undefined) } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context) => {
          context.switchToHttp().getRequest().user = { id: 'user-id', role: 'admin' };
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves every subscription route', async () => {
    const server = app.getHttpServer();

    await request(server).get('/subscriptions/plans').expect(200);
    await request(server).get('/subscriptions/plans/plan-id').expect(200);
    await request(server).post('/subscriptions/subscribe').send({ planId: 'plan-id' }).expect(201);
    await request(server).post('/subscriptions/renew').send({ paymentId: 'pay-id' }).expect(201);
    await request(server).post('/subscriptions/upgrade').send({ planId: 'new-plan' }).expect(201);
    await request(server).post('/subscriptions/cancel').send({ cancelImmediately: true }).expect(201);
    await request(server).get('/subscriptions/status').expect(200);
    await request(server).get('/subscriptions/history').expect(200);
    await request(server).get('/subscriptions/admin/subscriptions').expect(200);
    await request(server).get('/subscriptions/admin/stats').expect(200);
    await request(server).post('/subscriptions/admin/plans').send({ name: 'Gold', nameAr: 'Gold', price: 1, durationDays: 30 }).expect(201);
    await request(server).patch('/subscriptions/admin/plans/plan-id').send({ price: 2 }).expect(200);
    await request(server).delete('/subscriptions/admin/plans/plan-id').expect(200);
  });
});
