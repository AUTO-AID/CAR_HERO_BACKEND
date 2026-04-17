import { Inject, Injectable } from '@nestjs/common';
import { IServiceRepository } from '../../domain/repositories/service.repository.interface';
import { ServiceCategory } from '../../../../core/enums/status.enum';

@Injectable()
export class GetServicesUseCase {
  constructor(
    @Inject(IServiceRepository)
    private readonly serviceRepository: IServiceRepository,
  ) {}

  async execute(category?: ServiceCategory) {
    if (category) {
      return this.serviceRepository.findByCategory(category);
    }
    return this.serviceRepository.findAll({ isActive: true });
  }
}
