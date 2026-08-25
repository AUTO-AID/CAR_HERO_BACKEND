import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RegistrationStatus, ServiceCategory } from '../../../../core/enums/status.enum';
import { IProviderRepository } from '../../domain/repositories/provider.repository.interface';
import { ManageProvidersUseCase } from './manage-providers.use-case';
import { UpdateProviderLocationUseCase } from './update-provider-location.use-case';
import { UpdateProviderStatusUseCase } from './update-provider-status.use-case';
import { ProviderStatus } from '../../../../core/enums/status.enum';
import { getModelToken } from '@nestjs/mongoose';
import { Service } from '../../../services/infrastructure/persistence/mongoose/schemas/service.schema';
import { User } from '../../../users/infrastructure/persistence/mongoose/schemas/user.schema';
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

  /** حساب الدخول الذي يشترطه `apply` — يُضبط لكل اختبار عبر `accountLookup` */
  let accountLookup: jest.Mock;
  const userModel = {
    findOne: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn(() => accountLookup()),
    })),
  };

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
    accountLookup = jest.fn().mockResolvedValue({ _id: 'user-id', isVerified: true });
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
        { provide: getModelToken(User.name), useValue: userModel },
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

  /**
   * `apply` هو الباب العام من الموقع. الشروط الثلاثة أدناه هي ما يمنع نشوء
   * وثيقة `providers` بلا حساب دخول يقابلها — وهي الحالة التي كان صاحبها
   * يُعتمد ثم لا يستطيع الدخول إلى التطبيق أبداً.
   */
  describe('website specialties -> catalog services', () => {
    /**
     * نموذج الموقع يرسل تخصّصات نصّية («detailing»، «towing») بينما لوحة
     * المزوّد تقرأ معرّفات الكتالوج. بلا الترجمة كان المزوّد يملأ خدماته
     * وأسعارها عند التسجيل ثم يجد «خدماتي وأسعاري» فارغة تماماً.
     */
    it('resolves specialties into catalog ids priced from the declaration', async () => {
      await manageUseCase.apply({
        phone: '+963999999999',
        businessName: 'Hero Garage',
        ownerName: 'Owner',
        longitude: 36.2,
        latitude: 33.5,
        services_list: [
          { service_id: 'detailing', name: 'غسيل وتلميع', price: 7500 },
        ],
      } as any);

      const created = (repository.create as jest.Mock).mock.calls[0][0];
      expect(created.services).toEqual([serviceId]);
      expect(created.servicePrices).toEqual({ [serviceId]: 7500 });
      expect(created.serviceAvailability).toEqual({ [serviceId]: true });
      expect(created.serviceCategories).toEqual([ServiceCategory.CAR_WASH]);
      // نفس شكل ما تكتبه `updateServices` من اللوحة
      expect(created.services_list[0]).toMatchObject({ service_id: serviceId, price: 7500 });
    });

    it('leaves a catalog-shaped selection untouched', async () => {
      await manageUseCase.apply({
        phone: '+963999999999',
        businessName: 'Hero Garage',
        ownerName: 'Owner',
        longitude: 36.2,
        latitude: 33.5,
        requestedServices: [serviceId],
        servicePrices: { [serviceId]: 1234 },
      } as any);

      const created = (repository.create as jest.Mock).mock.calls[0][0];
      expect(created.servicePrices).toEqual({ [serviceId]: 1234 });
    });
  });

  describe('apply (website form)', () => {
    const application: any = {
      phone: '+963999999999',
      businessName: 'Hero Garage',
      longitude: 36.2,
      latitude: 33.5,
    };

    it('creates a pending profile when a verified account exists', async () => {
      repository.findByPhone.mockResolvedValue(null);
      repository.create.mockResolvedValue(provider);

      await manageUseCase.apply(application);

      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
        isApproved: false,
        isActive: false,
        registrationStatus: RegistrationStatus.PENDING,
      }));
    });

    it('refuses an application with no login account behind it', async () => {
      accountLookup.mockResolvedValue(null);

      await expect(manageUseCase.apply(application)).rejects.toThrow(BadRequestException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('refuses an application whose account is not verified yet', async () => {
      accountLookup.mockResolvedValue({ _id: 'user-id', isVerified: false });

      await expect(manageUseCase.apply(application)).rejects.toThrow(BadRequestException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    /**
     * المسار عامّ بلا مصادقة، و`create` يُحدّث عند تكرار الرقم بينما `apply`
     * يفرض `isApproved:false` — فبدون هذا الحارس يستطيع أي زائر تخفيض فنّي
     * معتمد إلى «قيد المراجعة» بإعادة ملء النموذج باسمه.
     */
    it('refuses to demote an already-approved provider', async () => {
      repository.findByPhone.mockResolvedValue({ ...provider, isApproved: true });

      await expect(manageUseCase.apply(application)).rejects.toThrow(ConflictException);
      expect(repository.update).not.toHaveBeenCalled();
    });
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
