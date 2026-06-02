import { Test, TestingModule } from '@nestjs/testing';
import { UpdateProviderLocationUseCase } from './update-provider-location.use-case';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderStatus } from '../../../../core/enums/status.enum';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Provider } from '../../../providers/infrastructure/persistence/mongoose/schemas/provider.schema';

describe('UpdateProviderLocationUseCase', () => {
  let useCase: UpdateProviderLocationUseCase;
  let mockRepo: any;
  let mockProviderModel: any;
  let mockCache: any;
  let mockEventEmitter: any;

  beforeEach(async () => {
    mockRepo = {
      findById: jest.fn(),
      updateProviderLocation: jest.fn(),
    };
    mockProviderModel = {
      findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
    };
    mockCache = { del: jest.fn() };
    mockEventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateProviderLocationUseCase,
        { provide: IOrderRepository, useValue: mockRepo },
        { provide: getModelToken(Provider.name), useValue: mockProviderModel },
        { provide: CACHE_MANAGER, useValue: mockCache },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    useCase = module.get<UpdateProviderLocationUseCase>(UpdateProviderLocationUseCase);
  });

  it('should throw ForbiddenException if user is not the assigned provider', async () => {
    mockRepo.findById.mockResolvedValue({ 
      id: 'id', 
      providerId: 'real-provider',
      status: OrderStatus.ACCEPTED 
    });

    await expect(useCase.execute('id', { coordinates: [1, 2] }, { _id: 'hacker', role: 'provider' }))
      .rejects.toThrow(ForbiddenException);
  });

  it('should throw BadRequestException if order is not active', async () => {
    mockRepo.findById.mockResolvedValue({ 
      id: 'id', 
      providerId: 'prov',
      status: OrderStatus.COMPLETED 
    });

    await expect(useCase.execute('id', { coordinates: [1, 2] }, { _id: 'prov', role: 'provider' }))
      .rejects.toThrow(BadRequestException);
  });

  it('should successfully update location for assigned active provider', async () => {
    mockRepo.findById.mockResolvedValue({ 
      id: 'id', 
      providerId: 'prov',
      status: OrderStatus.IN_PROGRESS 
    });

    mockRepo.updateProviderLocation.mockResolvedValue({
      id: 'id',
      providerLocationUpdatedAt: new Date(),
    });

    await useCase.execute('id', { coordinates: [10, 20] }, { _id: 'prov', role: 'provider' });

    expect(mockRepo.updateProviderLocation).toHaveBeenCalledWith('id', { coordinates: [10, 20] });
    expect(mockCache.del).toHaveBeenCalledWith('order_id');
    expect(mockEventEmitter.emit).toHaveBeenCalled();
  });

  it('should update location while provider is en route', async () => {
    mockRepo.findById.mockResolvedValue({
      id: 'id',
      providerId: 'prov',
      status: OrderStatus.PROVIDER_EN_ROUTE,
    });
    mockRepo.updateProviderLocation.mockResolvedValue({
      id: 'id',
      providerLocationUpdatedAt: new Date(),
    });

    await useCase.execute('id', { coordinates: [36.2, 33.5] }, { _id: 'prov', role: 'provider' });

    expect(mockRepo.updateProviderLocation).toHaveBeenCalledWith('id', { coordinates: [36.2, 33.5] });
  });

  it('should reject invalid longitude and latitude ranges', async () => {
    mockRepo.findById.mockResolvedValue({
      id: 'id',
      providerId: 'prov',
      status: OrderStatus.PROVIDER_EN_ROUTE,
    });

    await expect(
      useCase.execute('id', { coordinates: [250, 95] }, { _id: 'prov', role: 'provider' }),
    ).rejects.toThrow(BadRequestException);
  });
});
