import { Test, TestingModule } from '@nestjs/testing';
import { ReviewOrderUseCase } from './review-order.use-case';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderStatus } from '../../../../common/enums/status.enum';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('ReviewOrderUseCase', () => {
  let useCase: ReviewOrderUseCase;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      findById: jest.fn(),
      addReview: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewOrderUseCase,
        { provide: IOrderRepository, useValue: mockRepo },
      ],
    }).compile();

    useCase = module.get<ReviewOrderUseCase>(ReviewOrderUseCase);
  });

  it('should throw ForbiddenException if user is not the owner', async () => {
    mockRepo.findById.mockResolvedValue({ id: 'id', user: 'real-user' });
    await expect(useCase.execute('id', { rating: 5 }, { _id: 'other-user', role: 'user' }))
      .rejects.toThrow(ForbiddenException);
  });

  it('should throw BadRequestException if order is not completed', async () => {
    mockRepo.findById.mockResolvedValue({ id: 'id', user: 'user-id', status: OrderStatus.PENDING });
    await expect(useCase.execute('id', { rating: 5 }, { _id: 'user-id', role: 'user' }))
      .rejects.toThrow(BadRequestException);
  });

  it('should successfully add a review for a completed order', async () => {
    mockRepo.findById.mockResolvedValue({ id: 'id', user: 'user-id', status: OrderStatus.COMPLETED });
    mockRepo.addReview.mockResolvedValue({ id: 'id', rating: 5 });

    const result = await useCase.execute('id', { rating: 5, comment: 'Great!' }, { _id: 'user-id', role: 'user' });

    expect(result.rating).toBe(5);
    expect(mockRepo.addReview).toHaveBeenCalledWith('id', 5, 'Great!');
  });
});
