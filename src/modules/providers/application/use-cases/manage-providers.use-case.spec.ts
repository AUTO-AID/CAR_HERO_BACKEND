import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RegistrationStatus, ServiceCategory } from '../../../../core/enums/status.enum';
import { IProviderRepository } from '../../domain/repositories/provider.repository.interface';
import { ManageProvidersUseCase } from './manage-providers.use-case';
import { UpdateProviderLocationUseCase } from './update-provider-location.use-case';
import { UpdateProviderStatusUseCase } from './update-provider-status.use-case';
import { ProviderStatus } from '../../../../core/enums/status.enum';

describe('Provider management use cases', () => {
  let manageUseCase: ManageProvidersUseCase;
  let locationUseCase: UpdateProviderLocationUseCase;
  let statusUseCase: UpdateProviderStatusUseCase;
  let repository: jest.Mocked<IProviderRepository>;

  const provider: any = {
    id: 'provider-id',
    phone: '+963999999999',
    businessName: 'Hero Garage',
    isActive: true,
    isApproved: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ManageProvidersUseCase,
        UpdateProviderLocationUseCase,
        UpdateProviderStatusUseCase,
        {
          provide: IProviderRepository,
          useValue: {
            create: jest.fn(),
            findByPhone: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            updateLocation: jest.fn(),
            updateStatus: jest.fn(),
            updateRegistrationStatus: jest.fn(),
            setActive: jest.fn(),
          },
        },
      ],
    }).compile();

    manageUseCase = module.get(ManageProvidersUseCase);
    locationUseCase = module.get(UpdateProviderLocationUseCase);
    statusUseCase = module.get(UpdateProviderStatusUseCase);
    repository = module.get(IProviderRepository);
  });

  it('creates a pending provider with normalized location', async () => {
    repository.findByPhone.mockResolvedValue(null);
    repository.create.mockResolvedValue(provider);

    const result = await manageUseCase.create({
      phone: '+963999999999',
      businessName: 'Hero Garage',
      longitude: 36.2,
      latitude: 33.5,
      serviceCategories: [ServiceCategory.TOWING],
    });

    expect(result.id).toBe('provider-id');
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
      registrationStatus: RegistrationStatus.PENDING,
      location: { type: 'Point', coordinates: [36.2, 33.5] },
      serviceCategories: [ServiceCategory.TOWING],
    }));
  });

  it('prevents duplicate provider phone numbers', async () => {
    repository.findByPhone.mockResolvedValue(provider);

    await expect(manageUseCase.create({
      phone: '+963999999999',
      businessName: 'Duplicate',
      longitude: 36.2,
      latitude: 33.5,
    })).rejects.toThrow(ConflictException);
  });

  it('rejects invalid coordinates', async () => {
    await expect(locationUseCase.execute('provider-id', 200, 33.5)).rejects.toThrow(BadRequestException);
  });

  it('prevents inactive or unapproved providers from going online', async () => {
    repository.findById.mockResolvedValue({ ...provider, isApproved: false });

    await expect(statusUseCase.execute('provider-id', ProviderStatus.ONLINE)).rejects.toThrow(BadRequestException);
  });

  it('updates provider operational sub-resources', async () => {
    repository.findById.mockResolvedValue(provider);
    repository.update.mockResolvedValue(provider);

    await manageUseCase.updateServices('provider-id', { services: ['service-id'], serviceCategories: [ServiceCategory.CAR_WASH] });
    await manageUseCase.updateWorkingHours('provider-id', { workingHours: [{ day: 'sat', open: '09:00', close: '17:00' }] });
    await manageUseCase.updateDocuments('provider-id', { documents: ['doc.pdf'] });
    await manageUseCase.updateBankAccount('provider-id', { bankAccount: { iban: 'SY123' } });

    expect(repository.update).toHaveBeenCalledTimes(4);
  });
});
