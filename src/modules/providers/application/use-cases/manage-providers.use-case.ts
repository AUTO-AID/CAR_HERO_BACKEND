import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RegistrationStatus } from '../../../../core/enums/status.enum';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Service, ServiceDocument } from '../../../services/infrastructure/persistence/mongoose/schemas/service.schema';
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
    @InjectModel(Service.name) private readonly serviceModel: Model<ServiceDocument>,
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
    const serviceIds = dto.services.map((serviceId) => serviceId.toString());
    const selectedIds = new Set(serviceIds);
    const services = await this.serviceModel.find({
      _id: { $in: serviceIds.map((serviceId) => new Types.ObjectId(serviceId)) },
      isActive: true,
    }).lean().exec();
    if (services.length !== serviceIds.length) {
      throw new BadRequestException('Every selected service must exist and be active');
    }
    const servicePrices = this.validateServicePrices(dto.servicePrices || {}, selectedIds);
    const serviceAvailability = this.validateServiceAvailability(dto.serviceAvailability || {}, selectedIds);
    const categories = Array.from(new Set(services.map((service) => service.category)));
    const servicesList = services
      .filter((service) => serviceAvailability[service._id.toString()] !== false)
      .map((service) => ({
        service_id: service._id.toString(),
        name: service.nameAr || service.name,
        category: service.category,
        price: servicePrices[service._id.toString()] ?? (service.discountedPrice || service.basePrice),
        isActive: true,
      }));
    return this.providerRepository.update(id, {
      services: serviceIds,
      serviceCategories: categories,
      requestedServices: serviceIds,
      servicePrices,
      serviceAvailability,
      services_list: servicesList,
    });
  }

  async updateWorkingHours(id: string, dto: UpdateProviderWorkingHoursDto) {
    await this.ensureProvider(id);
    const days = dto.workingHours.map((item) => item.day);
    if (new Set(days).size !== 7) {
      throw new BadRequestException('Working hours must contain each weekday exactly once');
    }
    dto.workingHours.forEach((item) => {
      if (!item.isClosed && this.timeToMinutes(item.open) >= this.timeToMinutes(item.close)) {
        throw new BadRequestException(`${item.day} closing time must be after opening time`);
      }
    });
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

  private timeToMinutes(value: string) {
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private validateServicePrices(prices: Record<string, number>, selectedIds: Set<string>) {
    return Object.fromEntries(Object.entries(prices).map(([serviceId, price]) => {
      if (!selectedIds.has(serviceId)) throw new BadRequestException('Service price key must belong to selected services');
      const numericPrice = Number(price);
      if (!Number.isFinite(numericPrice) || numericPrice < 0 || numericPrice > 1_000_000_000) {
        throw new BadRequestException('Service price must be a valid positive amount');
      }
      return [serviceId, numericPrice];
    }));
  }

  private validateServiceAvailability(availability: Record<string, boolean>, selectedIds: Set<string>) {
    return Object.fromEntries(Array.from(selectedIds).map((serviceId) => {
      const value = availability[serviceId];
      if (value !== undefined && typeof value !== 'boolean') {
        throw new BadRequestException('Service availability must be boolean');
      }
      return [serviceId, value ?? true];
    }));
  }
}
