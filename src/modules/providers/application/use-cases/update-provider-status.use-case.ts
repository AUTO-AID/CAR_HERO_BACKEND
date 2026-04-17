import { Inject, Injectable } from '@nestjs/common';
import { IProviderRepository } from '../../domain/repositories/provider.repository.interface';
import { ProviderStatus } from '../../../../core/enums/status.enum';

@Injectable()
export class UpdateProviderStatusUseCase {
  constructor(
    @Inject(IProviderRepository)
    private readonly providerRepository: IProviderRepository,
  ) {}

  async execute(id: string, status: ProviderStatus) {
    return this.providerRepository.updateStatus(id, status);
  }
}
