import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { IProviderRepository } from '../../domain/repositories/provider.repository.interface';
import { ProviderStatus } from '../../../../core/enums/status.enum';

@Injectable()
export class UpdateProviderStatusUseCase {
  constructor(
    @Inject(IProviderRepository)
    private readonly providerRepository: IProviderRepository,
  ) {}

  async execute(id: string, status: ProviderStatus) {
    const provider = await this.providerRepository.findById(id);
    if (!provider?.isApproved || !provider.isActive) {
      throw new BadRequestException('Provider must be active and approved before changing availability status');
    }
    return this.providerRepository.updateStatus(id, status);
  }
}
