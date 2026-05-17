import { Test, TestingModule } from '@nestjs/testing';
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

describe('SubscriptionsController', () => {
  let controller: SubscriptionsController;
  const req = { user: { id: 'user-id', role: 'user' } };

  const useCases = {
    getPlans: { execute: jest.fn(), findById: jest.fn() },
    subscribe: { execute: jest.fn() },
    status: { execute: jest.fn() },
    cancel: { execute: jest.fn() },
    renew: { execute: jest.fn() },
    upgrade: { execute: jest.fn() },
    history: { execute: jest.fn() },
    manage: { create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    list: { execute: jest.fn() },
    stats: { execute: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
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
      ],
    }).compile();

    controller = module.get(SubscriptionsController);
  });

  it('routes public plan endpoints', async () => {
    useCases.getPlans.execute.mockResolvedValue([]);
    useCases.getPlans.findById.mockResolvedValue({ id: 'plan-id' });

    await expect(controller.getPlans()).resolves.toEqual([]);
    await expect(controller.getPlanById('plan-id')).resolves.toEqual({ id: 'plan-id' });
  });

  it('routes user subscription endpoints with current user id', async () => {
    useCases.subscribe.execute.mockResolvedValue({ id: 'sub' });
    useCases.renew.execute.mockResolvedValue({ id: 'sub' });
    useCases.upgrade.execute.mockResolvedValue({ id: 'sub2' });
    useCases.cancel.execute.mockResolvedValue({ message: 'ok' });
    useCases.status.execute.mockResolvedValue({ isActive: true });
    useCases.history.execute.mockResolvedValue([]);

    await controller.subscribe(req, { planId: 'plan-id' });
    await controller.renew(req, { paymentId: 'pay-id' });
    await controller.upgrade(req, { planId: 'new-plan' });
    await controller.cancel(req, { cancelImmediately: true });
    await controller.checkStatus(req);
    await controller.getHistory(req);

    expect(useCases.subscribe.execute).toHaveBeenCalledWith({ userId: 'user-id', planId: 'plan-id' });
    expect(useCases.renew.execute).toHaveBeenCalledWith({ userId: 'user-id', paymentId: 'pay-id', autoRenew: undefined });
    expect(useCases.upgrade.execute).toHaveBeenCalledWith({ userId: 'user-id', planId: 'new-plan' });
    expect(useCases.cancel.execute).toHaveBeenCalledWith({ userId: 'user-id', cancelImmediately: true });
    expect(useCases.status.execute).toHaveBeenCalledWith('user-id');
    expect(useCases.history.execute).toHaveBeenCalledWith('user-id');
  });

  it('routes admin subscription endpoints', async () => {
    useCases.list.execute.mockResolvedValue({ subscriptions: [] });
    useCases.stats.execute.mockResolvedValue({ active: 1 });
    useCases.manage.create.mockResolvedValue({ id: 'plan' });
    useCases.manage.update.mockResolvedValue({ id: 'plan' });
    useCases.manage.delete.mockResolvedValue({ message: 'deleted' });

    await controller.listSubscriptions({ page: 1, limit: 10 });
    await controller.getStats();
    await controller.createPlan({ name: 'Gold', nameAr: 'Gold', price: 1, durationDays: 30 });
    await controller.updatePlan('plan-id', { price: 2 });
    await controller.deletePlan('plan-id');

    expect(useCases.list.execute).toHaveBeenCalledWith({ page: 1, limit: 10 });
    expect(useCases.stats.execute).toHaveBeenCalled();
    expect(useCases.manage.create).toHaveBeenCalled();
    expect(useCases.manage.update).toHaveBeenCalledWith('plan-id', { price: 2 });
    expect(useCases.manage.delete).toHaveBeenCalledWith('plan-id');
  });
});
