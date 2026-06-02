import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { OrderStatus } from '../../../../core/enums/status.enum';
import { StatusHistoryService } from '../../../status-history/application/services/status-history.service';
import { TransferEarningsUseCase } from '../../../wallet/application/use-cases/transfer-earnings.use-case';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { ConfirmOrderCompletionUseCase } from './confirm-order-completion.use-case';

describe('ConfirmOrderCompletionUseCase', () => {
  const orders = { findById: jest.fn(), update: jest.fn() };
  const cache = { del: jest.fn() };
  const transfer = { execute: jest.fn() };
  const histories = { record: jest.fn() };
  const events = { emit: jest.fn() };
  let useCase: ConfirmOrderCompletionUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ConfirmOrderCompletionUseCase,
        { provide: IOrderRepository, useValue: orders },
        { provide: CACHE_MANAGER, useValue: cache },
        { provide: TransferEarningsUseCase, useValue: transfer },
        { provide: StatusHistoryService, useValue: histories },
        { provide: EventEmitter2, useValue: events },
      ],
    }).compile();
    useCase = module.get(ConfirmOrderCompletionUseCase);
  });

  it('releases provider earnings only after the owning customer confirms completion', async () => {
    const order = {
      id: 'order-1',
      orderNumber: 'CH-1',
      userId: 'user-1',
      providerId: 'provider-1',
      status: OrderStatus.AWAITING_CUSTOMER_CONFIRMATION,
      total: 125,
    };
    orders.findById.mockResolvedValue(order);
    orders.update.mockResolvedValue({ ...order, status: OrderStatus.COMPLETED });

    const result = await useCase.execute('order-1', { _id: 'user-1', role: 'user' });

    expect(result.status).toBe(OrderStatus.COMPLETED);
    expect(transfer.execute).toHaveBeenCalledWith('provider-1', 125, 'order-1', 'order');
    expect(cache.del).toHaveBeenCalledWith('order_order-1');
  });

  it('rejects confirmation by a different customer', async () => {
    orders.findById.mockResolvedValue({ id: 'order-1', userId: 'user-1', status: OrderStatus.AWAITING_CUSTOMER_CONFIRMATION });
    await expect(useCase.execute('order-1', { _id: 'user-2', role: 'user' })).rejects.toBeInstanceOf(ForbiddenException);
  });
});
