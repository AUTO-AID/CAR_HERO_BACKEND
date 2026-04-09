import { Inject, Injectable } from '@nestjs/common';
import { IReviewRepository } from '../../domain/repositories/review.repository.interface';
import { ReviewEntity } from '../../domain/entities/review.entity';

@Injectable()
export class GetProviderReviewsUseCase {
  constructor(
    @Inject(IReviewRepository)
    private readonly reviewRepository: IReviewRepository,
  ) {}

  async execute(providerId: string, page: number = 1, limit: number = 10): Promise<{ reviews: ReviewEntity[]; total: number }> {
    return this.reviewRepository.findByProvider(providerId, { page, limit });
  }
}
