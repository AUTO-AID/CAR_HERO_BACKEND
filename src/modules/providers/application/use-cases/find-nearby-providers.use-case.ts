import { Inject, Injectable } from '@nestjs/common';
import { IProviderRepository } from '../../domain/repositories/provider.repository.interface';
import { NearbyProviderDto } from '../dtos/provider.dto';

@Injectable()
export class FindNearbyProvidersUseCase {
  constructor(
    @Inject(IProviderRepository)
    private readonly providerRepository: IProviderRepository,
  ) {}

  async execute(dto: NearbyProviderDto) {
    return this.providerRepository.findNearby(dto);
  }
}
