import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { GetOrderByIdUseCase } from './get-order-by-id.use-case';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('GetOrderByIdUseCase', () => {
  let useCase: GetOrderByIdUseCase;
  let mockRepo: any;
  let mockCacheManager: any;

  beforeEach(async () => {
    mockRepo = {
      findById: jest.fn(),
    };
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetOrderByIdUseCase,
        { provide: IOrderRepository, useValue: mockRepo },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    useCase = module.get<GetOrderByIdUseCase>(GetOrderByIdUseCase);
  });

  it('should throw NotFoundException if order does not exist in cache or DB', async () => {
    mockCacheManager.get.mockResolvedValue(null);
    mockRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute('id', { _id: 'user', role: 'user' }))
      .rejects.toThrow(NotFoundException);
  });

  it('should return from cache if exists', async () => {
    const mockOrder = { id: 'id', userId: 'owner-id' };
    mockCacheManager.get.mockResolvedValue(mockOrder);

    const result = await useCase.execute('id', { _id: 'owner-id', role: 'user' });
    expect(result).toEqual(mockOrder);
    expect(mockRepo.findById).not.toHaveBeenCalled();
  });

  it('should allow owner to view the order after fetching from DB', async () => {
    const mockOrder = { id: 'id', userId: 'owner-id' };
    mockCacheManager.get.mockResolvedValue(null);
    mockRepo.findById.mockResolvedValue(mockOrder);

    const result = await useCase.execute('id', { _id: 'owner-id', role: 'user' });
    expect(result).toEqual(mockOrder);
    expect(mockCacheManager.set).toHaveBeenCalled();
  });

  it('should allow admin to view any order', async () => {
    const mockOrder = { id: 'id', userId: 'owner-id' };
    mockCacheManager.get.mockResolvedValue(mockOrder);

    const result = await useCase.execute('id', { _id: 'admin-id', role: 'admin' });
    expect(result).toEqual(mockOrder);
  });
});
