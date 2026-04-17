import { Test, TestingModule } from '@nestjs/testing';
import { ReviewOrderUseCase } from './review-order.use-case';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { CreateReviewUseCase } from '../../../reviews/application/use-cases/create-review.use-case';
import { OrderStatus } from '../../../../core/enums/status.enum';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('ReviewOrderUseCase', () => {
  let useCase: ReviewOrderUseCase;
  let mockRepo: any;
  let mockCreateReview: any;

  beforeEach(async () => {
    mockRepo = {
      findById: jest.fn(),
      addReview: jest.fn(),
    };
    mockCreateReview = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewOrderUseCase,
        { provide: IOrderRepository, useValue: mockRepo },
        { provide: CreateReviewUseCase, useValue: mockCreateReview },
      ],
    }).compile();

    useCase = module.get<ReviewOrderUseCase>(ReviewOrderUseCase);
  });

  it('should successfully delegate review creation to CreateReviewUseCase', async () => {
    const mockResult = { id: 'id', rating: 5, comment: 'Great!' };
    mockCreateReview.execute.mockResolvedValue(mockResult);

    const result = await useCase.execute('id', { rating: 5, comment: 'Great!' }, { _id: 'user-id', role: 'user' });

    expect(result).toEqual(mockResult);
    expect(mockCreateReview.execute).toHaveBeenCalledWith(
      {
        orderId: 'id',
        rating: 5,
        comment: 'Great!'
      },
      { _id: 'user-id', role: 'user' }
    );
  });
});
