import { Inject, Injectable } from '@nestjs/common';
import { IProviderRepository } from '../../domain/repositories/provider.repository.interface';

@Injectable()
export class RecalculateProviderRatingUseCase {
  constructor(
    @Inject(IProviderRepository)
    private readonly providerRepository: IProviderRepository,
  ) {}

  async execute(id: string, averageRating: number, totalReviews: number) {
    await this.providerRepository.updateRating(id, averageRating, totalReviews);
  }
}
