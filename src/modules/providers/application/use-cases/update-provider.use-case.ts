import { Inject, Injectable } from '@nestjs/common';
import { IProviderRepository } from '../../domain/repositories/provider.repository.interface';
import { UpdateProviderDto } from '../dtos/provider.dto';

@Injectable()
export class UpdateProviderUseCase {
  constructor(
    @Inject(IProviderRepository)
    private readonly providerRepository: IProviderRepository,
  ) {}

  async execute(id: string, dto: UpdateProviderDto) {
    return this.providerRepository.update(id, dto);
  }
}
