import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IProviderRepository } from '../../domain/repositories/provider.repository.interface';

@Injectable()
export class UpdateProviderRatingUseCase {
  constructor(
    @Inject(IProviderRepository)
    private readonly providerRepository: IProviderRepository,
  ) {}

  async execute(id: string, newRating: number) {
    const provider = await this.providerRepository.findById(id);
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const totalReviews = provider.totalReviews;
    const currentAvg = provider.averageRating;
    
    // Calculate new average
    const updatedTotalReviews = totalReviews + 1;
    const updatedAvg = (currentAvg * totalReviews + newRating) / updatedTotalReviews;

    await this.providerRepository.updateRating(id, updatedAvg, updatedTotalReviews);
  }
}
