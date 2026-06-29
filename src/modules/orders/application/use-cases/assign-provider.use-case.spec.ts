import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AssignProviderUseCase } from './assign-provider.use-case';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderStatus } from '../../../../core/enums/status.enum';
import { NotFoundException } from '@nestjs/common';
import { StatusHistoryService } from '../../../status-history/application/services/status-history.service';
import { SchedulingAvailabilityService } from '../services/scheduling-availability.service';

describe('AssignProviderUseCase', () => {
  let useCase: AssignProviderUseCase;
  let mockRepo: any;
  let mockEventEmitter: any;

  beforeEach(async () => {
    mockRepo = {
      findById: jest.fn(),
      update: jest.fn(),
    };
    mockEventEmitter = {
      emit: jest.fn(),
    };
    const mockStatusHistoryService = {
      record: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignProviderUseCase,
        { provide: IOrderRepository, useValue: mockRepo },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: StatusHistoryService, useValue: mockStatusHistoryService },
        {
          provide: SchedulingAvailabilityService,
          useValue: { assertOffersService: jest.fn(), assertAvailable: jest.fn() },
        },
      ],
    }).compile();

    useCase = module.get<AssignProviderUseCase>(AssignProviderUseCase);
  });

  it('should throw NotFoundException if order not found', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute('id', 'prov-id')).rejects.toThrow(NotFoundException);
  });

  it('should successfully assign provider and emit events', async () => {
    const mockOrder = { id: 'id', status: OrderStatus.PENDING, orderNumber: 'CH-1', user: 'u1' };
    mockRepo.findById.mockResolvedValue(mockOrder);
    mockRepo.update.mockResolvedValue({ ...mockOrder, provider: 'prov-id', status: OrderStatus.ACCEPTED });

    const result = await useCase.execute('id', 'prov-id');

    expect(result.status).toBe(OrderStatus.ACCEPTED);
    expect(mockRepo.update).toHaveBeenCalled();
    expect(mockEventEmitter.emit).toHaveBeenCalledTimes(2); // STATUS_CHANGED and PROVIDER_ASSIGNED
    expect(mockEventEmitter.emit).toHaveBeenCalledWith('order.provider_assigned', {
      orderId: 'id',
      providerId: 'prov-id',
      orderNumber: 'CH-1',
    });
  });
});
