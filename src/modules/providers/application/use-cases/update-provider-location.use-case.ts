import { Inject, Injectable } from '@nestjs/common';
import { IProviderRepository } from '../../domain/repositories/provider.repository.interface';

@Injectable()
export class UpdateProviderLocationUseCase {
  constructor(
    @Inject(IProviderRepository)
    private readonly providerRepository: IProviderRepository,
  ) {}

  async execute(id: string, longitude: number, latitude: number) {
    return this.providerRepository.updateLocation(id, longitude, latitude);
  }
}
