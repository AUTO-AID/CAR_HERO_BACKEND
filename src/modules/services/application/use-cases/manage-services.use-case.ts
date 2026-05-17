import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IServiceRepository } from '../../domain/repositories/service.repository.interface';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';

@Injectable()
export class ManageServicesUseCase {
  constructor(
    @Inject(IServiceRepository)
    private readonly serviceRepository: IServiceRepository,
  ) {}

  async create(dto: CreateServiceDto) {
    this.validatePrices(dto.basePrice, dto.discountedPrice);
    return this.serviceRepository.create({
      ...dto,
      discountedPrice: dto.discountedPrice || 0,
      isActive: dto.isActive ?? true,
      isEmergency: dto.isEmergency ?? false,
      isSystemService: dto.isSystemService ?? true,
      sortOrder: dto.sortOrder || 0,
      options: dto.options || [],
      metadata: dto.metadata || {},
    });
  }

  async update(id: string, dto: UpdateServiceDto) {
    const current = await this.serviceRepository.findById(id);
    if (!current) throw new NotFoundException('Service not found');

    this.validatePrices(dto.basePrice ?? current.basePrice, dto.discountedPrice ?? current.discountedPrice);
    return this.serviceRepository.update(id, dto);
  }

  async setActive(id: string, isActive: boolean) {
    const service = await this.serviceRepository.findById(id);
    if (!service) throw new NotFoundException('Service not found');
    return this.serviceRepository.update(id, { isActive });
  }

  async delete(id: string) {
    const deleted = await this.serviceRepository.delete(id);
    if (!deleted) throw new NotFoundException('Service not found');
    return { message: 'Service deactivated successfully' };
  }

  private validatePrices(basePrice: number, discountedPrice?: number) {
    if (discountedPrice !== undefined && discountedPrice > basePrice) {
      throw new BadRequestException('Discounted price cannot be greater than base price');
    }
  }
}
