import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { IProviderRepository } from '../../domain/repositories/provider.repository.interface';
import { NearbyProviderDto } from '../dtos/provider.dto';

@Injectable()
export class FindNearbyProvidersUseCase {
  constructor(
    @Inject(IProviderRepository)
    private readonly providerRepository: IProviderRepository,
  ) {}

  async execute(dto: NearbyProviderDto) {
    if (dto.longitude < -180 || dto.longitude > 180 || dto.latitude < -90 || dto.latitude > 90) {
      throw new BadRequestException('Invalid coordinates');
    }
    return this.providerRepository.findNearby(dto);
  }
}
