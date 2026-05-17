import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ServiceCategory } from '../../../../core/enums/status.enum';
import { IServiceRepository } from '../../domain/repositories/service.repository.interface';
import { ManageServicesUseCase } from './manage-services.use-case';

describe('ManageServicesUseCase', () => {
  let useCase: ManageServicesUseCase;
  let repository: jest.Mocked<IServiceRepository>;

  const service: any = {
    id: 'service-id',
    name: 'Car Wash',
    nameAr: 'غسيل سيارات',
    category: ServiceCategory.CAR_WASH,
    basePrice: 100,
    discountedPrice: 80,
    estimatedDuration: 30,
    isActive: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ManageServicesUseCase,
        {
          provide: IServiceRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get(ManageServicesUseCase);
    repository = module.get(IServiceRepository);
  });

  it('creates a service with safe defaults', async () => {
    repository.create.mockResolvedValue(service);

    const result = await useCase.create({
      name: 'Car Wash',
      nameAr: 'غسيل سيارات',
      category: ServiceCategory.CAR_WASH,
      basePrice: 100,
      estimatedDuration: 30,
    });

    expect(result.id).toBe('service-id');
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
      isActive: true,
      isEmergency: false,
      isSystemService: true,
      discountedPrice: 0,
      options: [],
    }));
  });

  it('rejects a discounted price greater than base price', async () => {
    await expect(useCase.create({
      name: 'Bad',
      nameAr: 'Bad',
      category: ServiceCategory.OTHER,
      basePrice: 100,
      discountedPrice: 120,
      estimatedDuration: 30,
    })).rejects.toThrow(BadRequestException);
  });

  it('updates an existing service', async () => {
    repository.findById.mockResolvedValue(service);
    repository.update.mockResolvedValue({ ...service, basePrice: 120 });

    const result = await useCase.update('service-id', { basePrice: 120 });

    expect(result.basePrice).toBe(120);
    expect(repository.update).toHaveBeenCalledWith('service-id', { basePrice: 120 });
  });

  it('throws when updating a missing service', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(useCase.update('missing', { basePrice: 120 })).rejects.toThrow(NotFoundException);
  });

  it('deactivates service through delete', async () => {
    repository.delete.mockResolvedValue(true);
    await expect(useCase.delete('service-id')).resolves.toEqual({ message: 'Service deactivated successfully' });
  });
});
