import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UpdateOrderStatusUseCase } from './update-order-status.use-case';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { TransferEarningsUseCase } from '../../../wallet/application/use-cases/transfer-earnings.use-case';
import { OrderStatus } from '../../../../core/enums/status.enum';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { StatusHistoryService } from '../../../status-history/application/services/status-history.service';

describe('UpdateOrderStatusUseCase', () => {
  let useCase: UpdateOrderStatusUseCase;
  let repository: jest.Mocked<IOrderRepository>;
  let eventEmitter: EventEmitter2;

  const mockOrderRepository = {
    findById: jest.fn(),
    update: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockTransferEarnings = {
    execute: jest.fn(),
  };

  const mockStatusHistoryService = {
    record: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateOrderStatusUseCase,
        { provide: IOrderRepository, useValue: mockOrderRepository },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: TransferEarningsUseCase, useValue: mockTransferEarnings },
        { provide: StatusHistoryService, useValue: mockStatusHistoryService },
      ],
    }).compile();

    useCase = module.get<UpdateOrderStatusUseCase>(UpdateOrderStatusUseCase);
    repository = module.get(IOrderRepository);
    eventEmitter = module.get(EventEmitter2);
  });

  it('should throw NotFoundException if order does not exist', async () => {
    mockOrderRepository.findById.mockResolvedValue(null);
    await expect(useCase.execute('id', OrderStatus.COMPLETED, { _id: 'admin', role: 'admin' }))
      .rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException if user is not authorized', async () => {
    const mockOrder = { id: 'id', providerId: 'other-provider', status: OrderStatus.ACCEPTED };
    mockOrderRepository.findById.mockResolvedValue(mockOrder);
    
    await expect(useCase.execute('id', OrderStatus.COMPLETED, { _id: 'wrong-user', role: 'user' }))
      .rejects.toThrow(ForbiddenException);
  });

  it('should update status, emit event and clear cache when authorized', async () => {
    const mockOrder = { 
      id: 'id', 
      providerId: 'provider-id', 
      status: OrderStatus.IN_PROGRESS,
      orderNumber: 'CH-001',
      userId: 'user-id'
    };
    mockOrderRepository.findById.mockResolvedValue(mockOrder);
    mockOrderRepository.update.mockResolvedValue({ ...mockOrder, status: OrderStatus.AWAITING_CUSTOMER_CONFIRMATION });

    const result = await useCase.execute('id', OrderStatus.AWAITING_CUSTOMER_CONFIRMATION, { _id: 'provider-id', role: 'provider' });

    expect(result.status).toBe(OrderStatus.AWAITING_CUSTOMER_CONFIRMATION);
    expect(mockOrderRepository.update).toHaveBeenCalled();
    expect(mockCacheManager.del).toHaveBeenCalledWith('order_id');
    expect(mockEventEmitter.emit).toHaveBeenCalled();
  });

  it('should allow a provider to complete an in-progress order and transfer earnings', async () => {
    const mockOrder = {
      id: 'id',
      providerId: 'provider-id',
      status: OrderStatus.IN_PROGRESS,
      orderNumber: 'CH-002',
      userId: 'user-id',
      total: 75000,
    };
    mockOrderRepository.findById.mockResolvedValue(mockOrder);
    mockOrderRepository.update.mockResolvedValue({ ...mockOrder, status: OrderStatus.COMPLETED });

    const result = await useCase.execute('id', OrderStatus.COMPLETED, { _id: 'provider-id', role: 'provider' });

    expect(result.status).toBe(OrderStatus.COMPLETED);
    expect(mockOrderRepository.update).toHaveBeenCalledWith('id', expect.objectContaining({
      status: OrderStatus.COMPLETED,
      completedAt: expect.any(Date),
    }));
    expect(mockTransferEarnings.execute).toHaveBeenCalledWith('provider-id', 75000, 'id', 'order');
    expect(mockCacheManager.del).toHaveBeenCalledWith('order_id');
    expect(mockEventEmitter.emit).toHaveBeenCalled();
  });
});
