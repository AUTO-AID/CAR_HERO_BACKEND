import { Inject, Injectable } from '@nestjs/common';
import { IProviderRepository } from '../../domain/repositories/provider.repository.interface';
import { RegistrationStatus } from '../../../../core/enums/status.enum';

@Injectable()
export class ApproveProviderUseCase {
  constructor(
    @Inject(IProviderRepository)
    private readonly providerRepository: IProviderRepository,
  ) {}

  async execute(id: string) {
    return this.providerRepository.updateRegistrationStatus(id, RegistrationStatus.APPROVED);
  }
}
