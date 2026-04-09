import { Test, TestingModule } from '@nestjs/testing';
import { UpdateProviderLocationUseCase } from './update-provider-location.use-case';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderStatus } from '../../../../common/enums/status.enum';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

describe('UpdateProviderLocationUseCase', () => {
  let useCase: UpdateProviderLocationUseCase;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      findById: jest.fn(),
      updateProviderLocation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateProviderLocationUseCase,
        { provide: IOrderRepository, useValue: mockRepo },
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

    await useCase.execute('id', { coordinates: [10, 20] }, { _id: 'prov', role: 'provider' });

    expect(mockRepo.updateProviderLocation).toHaveBeenCalledWith('id', [10, 20]);
  });
});
