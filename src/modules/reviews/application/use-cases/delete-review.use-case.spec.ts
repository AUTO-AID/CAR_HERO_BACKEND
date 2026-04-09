import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { DeleteReviewUseCase } from './delete-review.use-case';
import { IReviewRepository } from '../../domain/repositories/review.repository.interface';
import { ProvidersService } from '../../../providers/providers.service';

describe('DeleteReviewUseCase', () => {
  let useCase: DeleteReviewUseCase;
  let reviewRepository: jest.Mocked<IReviewRepository>;
  let providersService: jest.Mocked<ProvidersService>;

  const mockReviewRepository = {
    findById: jest.fn(),
    delete: jest.fn(),
    getAverageRating: jest.fn(),
  };

  const mockProvidersService = {
    recalculateRating: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteReviewUseCase,
        { provide: IReviewRepository, useValue: mockReviewRepository },
        { provide: ProvidersService, useValue: mockProvidersService },
      ],
    }).compile();

    useCase = module.get<DeleteReviewUseCase>(DeleteReviewUseCase);
    reviewRepository = module.get(IReviewRepository);
    providersService = module.get(ProvidersService);
  });

  const currentUser = { _id: 'user-123', role: 'user' };
  const adminUser = { _id: 'admin-123', role: 'admin' };

  it('should delete a review successfully when the user is the owner', async () => {
    const mockReview = { id: 'review-123', user: 'user-123', provider: 'provider-123' };
    reviewRepository.findById.mockResolvedValue(mockReview as any);
    reviewRepository.delete.mockResolvedValue(true);
    reviewRepository.getAverageRating.mockResolvedValue({ averageRating: 4.5, totalReviews: 10 });

    const result = await useCase.execute('review-123', currentUser);

    expect(result).toBe(true);
    expect(reviewRepository.delete).toHaveBeenCalledWith('review-123');
    expect(providersService.recalculateRating).toHaveBeenCalledWith('provider-123', 4.5, 10);
  });

  it('should delete a review successfully when the user is an admin', async () => {
    const mockReview = { id: 'review-123', user: 'other-user', provider: 'provider-123' };
    reviewRepository.findById.mockResolvedValue(mockReview as any);
    reviewRepository.delete.mockResolvedValue(true);
    reviewRepository.getAverageRating.mockResolvedValue({ averageRating: 4.0, totalReviews: 5 });

    const result = await useCase.execute('review-123', adminUser);

    expect(result).toBe(true);
    expect(reviewRepository.delete).toHaveBeenCalled();
  });

  it('should throw ForbiddenException if user is not the owner or admin', async () => {
    const mockReview = { id: 'review-123', user: 'other-user', provider: 'provider-123' };
    reviewRepository.findById.mockResolvedValue(mockReview as any);

    await expect(useCase.execute('review-123', currentUser)).rejects.toThrow(ForbiddenException);
  });

  it('should throw NotFoundException if review does not exist', async () => {
    reviewRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('non-existent', currentUser)).rejects.toThrow(NotFoundException);
  });
});
