import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CancelOrderUseCase } from './cancel-order.use-case';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderStatus } from '../../../../core/enums/status.enum';
import { BadRequestException } from '@nestjs/common';
import { StatusHistoryService } from '../../../status-history/application/services/status-history.service';

describe('CancelOrderUseCase', () => {
  let useCase: CancelOrderUseCase;
  let mockRepo: any;
  let mockCacheManager: any;

  beforeEach(async () => {
    mockRepo = {
      findById: jest.fn(),
      cancelOrder: jest.fn(),
    };
    mockCacheManager = {
      del: jest.fn(),
    };
    const mockWalletRepo = {
      executeTransaction: jest.fn(),
    };
    const mockStatusHistoryService = {
      record: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CancelOrderUseCase,
        { provide: IOrderRepository, useValue: mockRepo },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: 'IWalletRepository', useValue: mockWalletRepo },
        { provide: StatusHistoryService, useValue: mockStatusHistoryService },
      ],
    }).compile();

    useCase = module.get<CancelOrderUseCase>(CancelOrderUseCase);
  });

  it('should throw BadRequestException if order is already IN_PROGRESS', async () => {
    const mockOrder = { 
      id: 'id', 
      userId: 'user-id', 
      status: OrderStatus.IN_PROGRESS 
    };
    mockRepo.findById.mockResolvedValue(mockOrder);

    await expect(useCase.execute('id', { reason: 'test' }, { _id: 'user-id', role: 'user' }))
      .rejects.toThrow(BadRequestException);
  });

  it('should successfully cancel a PENDING order and clear cache', async () => {
    const mockOrder = { 
      id: 'id', 
      userId: 'user-id', 
      status: OrderStatus.PENDING,
      orderNumber: 'CH-X'
    };
    mockRepo.findById.mockResolvedValue(mockOrder);
    mockRepo.cancelOrder.mockResolvedValue({ ...mockOrder, status: OrderStatus.CANCELLED });

    const result = await useCase.execute('id', { reason: 'no longer needed' }, { _id: 'user-id', role: 'user' });

    expect(result.status).toBe(OrderStatus.CANCELLED);
    expect(mockRepo.cancelOrder).toHaveBeenCalled();
    expect(mockCacheManager.del).toHaveBeenCalledWith('order_id');
  });

  it('should allow the internal system actor to auto-cancel an expired order', async () => {
    const mockOrder = {
      id: 'id',
      userId: 'user-id',
      status: OrderStatus.PENDING,
      orderNumber: 'CH-X',
    };
    mockRepo.findById.mockResolvedValue(mockOrder);
    mockRepo.cancelOrder.mockResolvedValue({ ...mockOrder, status: OrderStatus.CANCELLED });

    await useCase.execute(
      'id',
      { reason: 'expired', cancelledBy: 'system' },
      { _id: 'system', role: 'system' },
    );

    expect(mockRepo.cancelOrder).toHaveBeenCalledWith('id', 'expired', 'system');
  });
});
