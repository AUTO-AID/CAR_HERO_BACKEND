import { Inject, Injectable } from '@nestjs/common';
import { IServiceRepository } from '../../domain/repositories/service.repository.interface';

@Injectable()
export class GetServiceStatsUseCase {
  constructor(
    @Inject(IServiceRepository)
    private readonly serviceRepository: IServiceRepository,
  ) {}

  async execute() {
    return this.serviceRepository.getStats();
  }
}
