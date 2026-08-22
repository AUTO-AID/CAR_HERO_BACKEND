import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { OrdersCronService } from './orders-cron.service';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { CancelOrderUseCase } from '../../application/use-cases/cancel-order.use-case';
import { ConfirmOrderCompletionUseCase } from '../../application/use-cases/confirm-order-completion.use-case';
import { Order } from '../persistence/mongoose/schemas/order.schema';
import { NotificationsService } from '../../../notifications/application/services/notifications.service';

/**
 * هذه المكنسة شبكة أمان لا آلية توزيع: الطلب الفوري يُحسم خلال عشر دقائق في
 * `ProviderDispatchService`. الاختبارات تثبّت أنها لا تتجاوز دورها ولا تخلط
 * بين الطلب الفوري والحجز المجدول.
 */
describe('OrdersCronService · handleExpiredOrders', () => {
  let service: OrdersCronService;
  const repository = { findExpiredPendingOrders: jest.fn() };
  const cancelOrder = { execute: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersCronService,
        { provide: IOrderRepository, useValue: repository },
        { provide: getModelToken(Order.name), useValue: { find: jest.fn(), findByIdAndUpdate: jest.fn() } },
        { provide: CancelOrderUseCase, useValue: cancelOrder },
        { provide: ConfirmOrderCompletionUseCase, useValue: { executeAsSystem: jest.fn() } },
        { provide: NotificationsService, useValue: { createNotification: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get(OrdersCronService);
  });

  it('asks for orders stale by two hours, not by the offer window', async () => {
    repository.findExpiredPendingOrders.mockResolvedValue([]);

    await service.handleExpiredOrders();

    expect(repository.findExpiredPendingOrders).toHaveBeenCalledWith(2);
    expect(cancelOrder.execute).not.toHaveBeenCalled();
  });

  it('gives a scheduled booking a reason that names its missed appointment', async () => {
    repository.findExpiredPendingOrders.mockResolvedValue([
      { id: 'a', orderNumber: 'CH-1', isScheduled: false },
      { id: 'b', orderNumber: 'CH-2', isScheduled: true },
    ]);

    await service.handleExpiredOrders();

    expect(cancelOrder.execute).toHaveBeenCalledTimes(2);
    expect(cancelOrder.execute.mock.calls[0][1].reason).toContain('دون إسناد');
    expect(cancelOrder.execute.mock.calls[1][1].reason).toContain('مضى موعد الحجز');
  });

  it('keeps sweeping after one order fails to cancel', async () => {
    repository.findExpiredPendingOrders.mockResolvedValue([
      { id: 'a', orderNumber: 'CH-1', isScheduled: false },
      { id: 'b', orderNumber: 'CH-2', isScheduled: false },
    ]);
    cancelOrder.execute.mockRejectedValueOnce(new Error('boom'));

    await service.handleExpiredOrders();

    expect(cancelOrder.execute).toHaveBeenCalledTimes(2);
  });
});
