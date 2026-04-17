import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IProviderRepository } from '../../domain/repositories/provider.repository.interface';

@Injectable()
export class GetProviderByIdUseCase {
  constructor(
    @Inject(IProviderRepository)
    private readonly providerRepository: IProviderRepository,
  ) {}

  async execute(id: string) {
    const provider = await this.providerRepository.findById(id);
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }
    return provider;
  }
}
