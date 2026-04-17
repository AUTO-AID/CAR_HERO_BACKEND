import { Inject, Injectable } from '@nestjs/common';
import { IProviderRepository } from '../../domain/repositories/provider.repository.interface';
import { ProviderQueryDto } from '../dtos/provider.dto';
import { createPaginationResult } from '../../../../core/utils/pagination.util';

@Injectable()
export class GetProvidersUseCase {
  constructor(
    @Inject(IProviderRepository)
    private readonly providerRepository: IProviderRepository,
  ) {}

  async execute(query: ProviderQueryDto) {
    const { providers, total } = await this.providerRepository.findAll(query);
    return createPaginationResult(providers, total, query.page || 1, query.limit || 10);
  }
}
