import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { Role } from '../../../../core/enums/roles.enum';
import { ProviderStatus, ServiceCategory } from '../../../../core/enums/status.enum';
import { ApproveProviderUseCase } from '../../application/use-cases/approve-provider.use-case';
import { FindNearbyProvidersUseCase } from '../../application/use-cases/find-nearby-providers.use-case';
import { GetProviderByIdUseCase } from '../../application/use-cases/get-provider-by-id.use-case';
import { GetProviderStatsUseCase } from '../../application/use-cases/get-provider-stats.use-case';
import { GetProvidersUseCase } from '../../application/use-cases/get-providers.use-case';
import { GetTopRatedProvidersUseCase } from '../../application/use-cases/get-top-rated-providers.use-case';
import { ManageProvidersUseCase } from '../../application/use-cases/manage-providers.use-case';
import { UpdateProviderLocationUseCase } from '../../application/use-cases/update-provider-location.use-case';
import { UpdateProviderStatusUseCase } from '../../application/use-cases/update-provider-status.use-case';
import { UpdateProviderUseCase } from '../../application/use-cases/update-provider.use-case';
import { GetProviderDashboardUseCase } from '../../application/use-cases/get-provider-dashboard.use-case';
import { AuditLogService } from '../../../audit/application/services/audit-log.service';
import { IProviderRepository } from '../../domain/repositories/provider.repository.interface';
import { ProvidersController } from './providers.controller';

describe('ProvidersController', () => {
  let controller: ProvidersController;
  const user = { id: 'provider-id', phone: '+963999999999', role: Role.PROVIDER };

  const useCases = {
    list: { execute: jest.fn() },
    getById: { execute: jest.fn() },
    update: { execute: jest.fn() },
    location: { execute: jest.fn() },
    status: { execute: jest.fn() },
    nearby: { execute: jest.fn() },
    approve: { execute: jest.fn() },
    manage: {
      create: jest.fn(),
      reject: jest.fn(),
      setActive: jest.fn(),
      updateServices: jest.fn(),
      updateWorkingHours: jest.fn(),
      updateDocuments: jest.fn(),
      updateBankAccount: jest.fn(),
    },
    stats: { execute: jest.fn() },
    topRated: { execute: jest.fn() },
    dashboard: { execute: jest.fn() },
    audit: { record: jest.fn() },
    repository: { delete: jest.fn(), findByPhone: jest.fn().mockResolvedValue({ id: 'provider-id' }) },
    connection: { collection: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProvidersController],
      providers: [
        { provide: GetProvidersUseCase, useValue: useCases.list },
        { provide: GetProviderByIdUseCase, useValue: useCases.getById },
        { provide: UpdateProviderUseCase, useValue: useCases.update },
        { provide: UpdateProviderLocationUseCase, useValue: useCases.location },
        { provide: UpdateProviderStatusUseCase, useValue: useCases.status },
        { provide: FindNearbyProvidersUseCase, useValue: useCases.nearby },
        { provide: ApproveProviderUseCase, useValue: useCases.approve },
        { provide: ManageProvidersUseCase, useValue: useCases.manage },
        { provide: GetProviderStatsUseCase, useValue: useCases.stats },
        { provide: GetTopRatedProvidersUseCase, useValue: useCases.topRated },
        { provide: GetProviderDashboardUseCase, useValue: useCases.dashboard },
        { provide: AuditLogService, useValue: useCases.audit },
        { provide: IProviderRepository, useValue: useCases.repository },
        { provide: getConnectionToken(), useValue: useCases.connection },
      ],
    }).compile();

    controller = module.get(ProvidersController);
  });

  it('routes public provider endpoints', async () => {
    await controller.findAll({ page: 1, limit: 10 });
    await controller.findNearby({ longitude: 36.2, latitude: 33.5 });
    await controller.topRated(5);
    await controller.findOne('provider-id');

    expect(useCases.list.execute).toHaveBeenCalledWith({ page: 1, limit: 10 });
    expect(useCases.nearby.execute).toHaveBeenCalledWith({ longitude: 36.2, latitude: 33.5 });
    expect(useCases.topRated.execute).toHaveBeenCalledWith(5);
    expect(useCases.getById.execute).toHaveBeenCalledWith('provider-id');
  });

  it('routes provider self-management endpoints', async () => {
    await controller.getProfile(user);
    await controller.updateProfile(user, { businessName: 'New' });
    await controller.updateLocation(user, { longitude: 36.2, latitude: 33.5 });
    await controller.updateStatus(user, { status: ProviderStatus.ONLINE });
    await controller.updateMyServices(user, { services: ['service-id'], serviceCategories: [ServiceCategory.TOWING] });
    await controller.updateMyWorkingHours(user, { workingHours: [{ day: 'sat', open: '09:00', close: '17:00' }] });
    await controller.updateMyDocuments(user, { documents: ['doc.pdf'] });
    await controller.updateMyBankAccount(user, { bankAccount: { iban: 'SY123' } });

    expect(useCases.getById.execute).toHaveBeenCalledWith('provider-id');
    expect(useCases.update.execute).toHaveBeenCalledWith('provider-id', { businessName: 'New' });
    expect(useCases.location.execute).toHaveBeenCalledWith('provider-id', 36.2, 33.5);
    expect(useCases.status.execute).toHaveBeenCalledWith('provider-id', ProviderStatus.ONLINE);
    expect(useCases.manage.updateBankAccount).toHaveBeenCalledWith('provider-id', { bankAccount: { iban: 'SY123' } });
  });

  it('routes admin provider endpoints', async () => {
    const createDto = { phone: '+963999999999', businessName: 'Hero', longitude: 36.2, latitude: 33.5 };

    await controller.stats();
    await controller.create(createDto);
    await controller.adminFindOne('provider-id');
    await controller.adminUpdate('provider-id', { ownerName: 'Owner' });
    await controller.setActive('provider-id', false);
    await controller.reject('provider-id', { reason: 'missing documents' });
    await controller.delete('provider-id');
    await controller.approve('provider-id');

    expect(useCases.stats.execute).toHaveBeenCalled();
    expect(useCases.manage.create).toHaveBeenCalledWith(createDto);
    expect(useCases.update.execute).toHaveBeenCalledWith('provider-id', { ownerName: 'Owner' });
    expect(useCases.manage.reject).toHaveBeenCalledWith('provider-id', { reason: 'missing documents' });
    expect(useCases.approve.execute).toHaveBeenCalledWith('provider-id');
  });
});
