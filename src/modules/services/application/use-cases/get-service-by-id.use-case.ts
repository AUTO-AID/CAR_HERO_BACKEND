import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IServiceRepository } from '../../domain/repositories/service.repository.interface';

@Injectable()
export class GetServiceByIdUseCase {
  constructor(
    @Inject(IServiceRepository)
    private readonly serviceRepository: IServiceRepository,
  ) {}

  async execute(id: string, activeOnly = true) {
    const service = await this.serviceRepository.findById(id);
    if (!service || (activeOnly && !service.isActive)) {
      throw new NotFoundException('Service not found');
    }
    return service;
  }
}
