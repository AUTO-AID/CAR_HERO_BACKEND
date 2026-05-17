import { Inject, Injectable } from '@nestjs/common';
import { IProviderRepository } from '../../domain/repositories/provider.repository.interface';

@Injectable()
export class GetProviderStatsUseCase {
  constructor(
    @Inject(IProviderRepository)
    private readonly providerRepository: IProviderRepository,
  ) {}

  async execute() {
    return this.providerRepository.getStats();
  }
}
