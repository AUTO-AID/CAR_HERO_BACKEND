import { Test, TestingModule } from '@nestjs/testing';
import { GetOrdersUseCase } from './get-orders.use-case';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';

describe('GetOrdersUseCase', () => {
  let useCase: GetOrdersUseCase;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      findByCriteria: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetOrdersUseCase,
        { provide: IOrderRepository, useValue: mockRepo },
      ],
    }).compile();
    useCase = module.get<GetOrdersUseCase>(GetOrdersUseCase);
  });

  it('should call repository.findByCriteria with correct pagination', async () => {
    mockRepo.findByCriteria.mockResolvedValue({ orders: [], total: 0 });
    await useCase.execute({ status: 'pending' }, 2, 5);
    expect(mockRepo.findByCriteria).toHaveBeenCalledWith({ status: 'pending' }, { page: 2, limit: 5 });
  });
});
