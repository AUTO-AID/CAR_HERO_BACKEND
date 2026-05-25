import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RegistrationStatus } from '../../../../core/enums/status.enum';
import { IProviderRepository } from '../../domain/repositories/provider.repository.interface';
import {
  CreateProviderDto,
  RejectProviderDto,
  UpdateProviderBankAccountDto,
  UpdateProviderDocumentsDto,
  UpdateProviderServicesDto,
  UpdateProviderWorkingHoursDto,
} from '../dtos/provider.dto';

@Injectable()
export class ManageProvidersUseCase {
  constructor(
    @Inject(IProviderRepository)
    private readonly providerRepository: IProviderRepository,
  ) {}

  async create(dto: CreateProviderDto) {
    this.validateCoordinates(dto.longitude, dto.latitude);
    const existing = await this.providerRepository.findByPhone(dto.phone);

    const mappedData = {
      ...dto,
      category: dto.category || dto.businessType,
      accountStatus: dto.accountStatus || (dto.isApproved ? 'active' : 'pending'),
      is_emergency: dto.is_emergency ?? dto.emergency247 ?? false,
      emergency247: dto.emergency247 ?? dto.is_emergency ?? false,
      requestedServices: dto.requestedServices || (dto.services_list || []).map((service: any) => service.service_id).filter(Boolean),
      servicePrices: dto.servicePrices || Object.fromEntries((dto.services_list || []).map((service: any) => [service.service_id, service.price]).filter(([id]) => Boolean(id))),
      location: { type: 'Point', coordinates: [dto.longitude, dto.latitude] },
      serviceCategories: dto.serviceCategories || [],
      services: dto.services || [],
      workingHours: dto.workingHours || [],
      isActive: dto.isActive ?? true,
      isApproved: dto.isApproved ?? false,
      registrationStatus: dto.isApproved ? RegistrationStatus.APPROVED : RegistrationStatus.PENDING,
    };

    if (existing) {
      return this.providerRepository.update(existing.id, mappedData);
    }

    return this.providerRepository.create(mappedData);
  }

  async reject(id: string, dto: RejectProviderDto) {
    if (!dto.reason?.trim()) {
      throw new BadRequestException('Rejection reason is required');
    }
    return this.providerRepository.updateRegistrationStatus(id, RegistrationStatus.REJECTED, dto.reason);
  }

  async setActive(id: string, isActive: boolean) {
    return this.providerRepository.setActive(id, isActive);
  }

  async updateServices(id: string, dto: UpdateProviderServicesDto) {
    await this.ensureProvider(id);
    return this.providerRepository.update(id, {
      services: dto.services,
      ...(dto.serviceCategories ? { serviceCategories: dto.serviceCategories } : {}),
    });
  }

  async updateWorkingHours(id: string, dto: UpdateProviderWorkingHoursDto) {
    await this.ensureProvider(id);
    return this.providerRepository.update(id, { workingHours: dto.workingHours });
  }

  async updateDocuments(id: string, dto: UpdateProviderDocumentsDto) {
    await this.ensureProvider(id);
    return this.providerRepository.update(id, { documents: dto.documents });
  }

  async updateBankAccount(id: string, dto: UpdateProviderBankAccountDto) {
    await this.ensureProvider(id);
    return this.providerRepository.update(id, { bankAccount: dto.bankAccount });
  }

  private async ensureProvider(id: string) {
    const provider = await this.providerRepository.findById(id);
    if (!provider) throw new NotFoundException('Provider not found');
    return provider;
  }

  private validateCoordinates(longitude: number, latitude: number) {
    if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      throw new BadRequestException('Invalid coordinates');
    }
  }
}
