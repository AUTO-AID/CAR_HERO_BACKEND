import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RegistrationStatus, ServiceCategory } from '../../../../core/enums/status.enum';
import { IProviderRepository } from '../../domain/repositories/provider.repository.interface';
import { ManageProvidersUseCase } from './manage-providers.use-case';
import { UpdateProviderLocationUseCase } from './update-provider-location.use-case';
import { UpdateProviderStatusUseCase } from './update-provider-status.use-case';
import { ProviderStatus } from '../../../../core/enums/status.enum';
import { getModelToken } from '@nestjs/mongoose';
import { Service } from '../../../services/infrastructure/persistence/mongoose/schemas/service.schema';
import { Types } from 'mongoose';

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
  const serviceId = '60b8d295f1d293001f3e4c8b';
  const serviceModel = {
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          { _id: new Types.ObjectId(serviceId), category: ServiceCategory.CAR_WASH, name: 'Car wash' },
        ]),
      }),
    }),
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
        { provide: getModelToken(Service.name), useValue: serviceModel },
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

  it('updates an existing provider with the same phone number', async () => {
    repository.findByPhone.mockResolvedValue(provider);
    repository.update.mockResolvedValue(provider);

    await manageUseCase.create({
      phone: '+963999999999',
      businessName: 'Duplicate',
      longitude: 36.2,
      latitude: 33.5,
    });

    expect(repository.update).toHaveBeenCalledWith('provider-id', expect.objectContaining({
      businessName: 'Duplicate',
    }));
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

    await manageUseCase.updateServices('provider-id', { services: [serviceId], serviceCategories: [ServiceCategory.CAR_WASH] });
    await manageUseCase.updateWorkingHours('provider-id', {
      workingHours: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        .map((day) => ({ day, open: '09:00', close: '17:00', isClosed: false })),
    });
    await manageUseCase.updateDocuments('provider-id', { documents: ['doc.pdf'] });
    await manageUseCase.updateBankAccount('provider-id', { bankAccount: { iban: 'SY123' } });

    expect(repository.update).toHaveBeenCalledTimes(4);
  });
});
