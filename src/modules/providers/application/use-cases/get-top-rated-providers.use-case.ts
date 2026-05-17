import { Inject, Injectable } from '@nestjs/common';
import { IProviderRepository } from '../../domain/repositories/provider.repository.interface';

@Injectable()
export class GetTopRatedProvidersUseCase {
  constructor(
    @Inject(IProviderRepository)
    private readonly providerRepository: IProviderRepository,
  ) {}

  async execute(limit = 10) {
    return this.providerRepository.findTopRated(limit);
  }
}
