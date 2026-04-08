import { Test, TestingModule } from '@nestjs/testing';
import { SearchOrdersUseCase } from './search-orders.use-case';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';

describe('SearchOrdersUseCase', () => {
  let useCase: SearchOrdersUseCase;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      search: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchOrdersUseCase,
        { provide: IOrderRepository, useValue: mockRepo },
      ],
    }).compile();

    useCase = module.get<SearchOrdersUseCase>(SearchOrdersUseCase);
  });

  it('should call repository.search with the query', async () => {
    mockRepo.search.mockResolvedValue([{ id: '1' }]);
    const result = await useCase.execute('abc');
    expect(mockRepo.search).toHaveBeenCalledWith('abc');
    expect(result).toHaveLength(1);
  });
});
