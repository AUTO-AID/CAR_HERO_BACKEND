import { Inject, Injectable } from '@nestjs/common';
import { IServiceRepository } from '../../domain/repositories/service.repository.interface';
import { ServiceCategory } from '../../../../core/enums/status.enum';
import { ListServicesQueryDto } from '../dto/list-services-query.dto';

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

  async list(query: ListServicesQueryDto) {
    return this.serviceRepository.findPaginated(query);
  }

  async emergency() {
    return this.serviceRepository.findAll({ isActive: true, isEmergency: true });
  }

  async categories() {
    return this.serviceRepository.getCategories();
  }

  async search(query: string) {
    return this.serviceRepository.search(query, true);
  }
}
