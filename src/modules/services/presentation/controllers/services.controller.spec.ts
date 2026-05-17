import { Test, TestingModule } from '@nestjs/testing';
import { ServiceCategory } from '../../../../core/enums/status.enum';
import { GetServiceByIdUseCase } from '../../application/use-cases/get-service-by-id.use-case';
import { GetServiceStatsUseCase } from '../../application/use-cases/get-service-stats.use-case';
import { GetServicesUseCase } from '../../application/use-cases/get-services.use-case';
import { ManageServicesUseCase } from '../../application/use-cases/manage-services.use-case';
import { ServicesController } from './services.controller';

describe('ServicesController', () => {
  let controller: ServicesController;

  const useCases = {
    getServices: {
      execute: jest.fn(),
      list: jest.fn(),
      emergency: jest.fn(),
      categories: jest.fn(),
      search: jest.fn(),
    },
    getById: { execute: jest.fn() },
    manage: {
      create: jest.fn(),
      update: jest.fn(),
      setActive: jest.fn(),
      delete: jest.fn(),
    },
    stats: { execute: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [
        { provide: GetServicesUseCase, useValue: useCases.getServices },
        { provide: GetServiceByIdUseCase, useValue: useCases.getById },
        { provide: ManageServicesUseCase, useValue: useCases.manage },
        { provide: GetServiceStatsUseCase, useValue: useCases.stats },
      ],
    }).compile();

    controller = module.get(ServicesController);
  });

  it('routes public service endpoints', async () => {
    useCases.getServices.execute.mockResolvedValue([]);
    useCases.getServices.categories.mockResolvedValue([]);
    useCases.getServices.emergency.mockResolvedValue([]);
    useCases.getServices.search.mockResolvedValue([]);
    useCases.getById.execute.mockResolvedValue({ id: 'service-id' });

    await controller.findAll(ServiceCategory.CAR_WASH);
    await controller.categories();
    await controller.emergency();
    await controller.search('wash');
    await controller.findOne('service-id');

    expect(useCases.getServices.execute).toHaveBeenCalledWith(ServiceCategory.CAR_WASH);
    expect(useCases.getServices.search).toHaveBeenCalledWith('wash');
    expect(useCases.getById.execute).toHaveBeenCalledWith('service-id', true);
  });

  it('routes admin service endpoints', async () => {
    useCases.getServices.list.mockResolvedValue({ services: [] });
    useCases.stats.execute.mockResolvedValue({ total: 1 });
    useCases.getById.execute.mockResolvedValue({ id: 'service-id' });
    useCases.manage.create.mockResolvedValue({ id: 'service-id' });
    useCases.manage.update.mockResolvedValue({ id: 'service-id' });
    useCases.manage.setActive.mockResolvedValue({ id: 'service-id', isActive: false });
    useCases.manage.delete.mockResolvedValue({ message: 'ok' });

    await controller.adminList({ page: 1, limit: 10 });
    await controller.adminStats();
    await controller.adminFindOne('service-id');
    await controller.create({ name: 'Wash', nameAr: 'Wash', category: ServiceCategory.CAR_WASH, basePrice: 100, estimatedDuration: 30 });
    await controller.update('service-id', { basePrice: 120 });
    await controller.setStatus('service-id', false);
    await controller.delete('service-id');

    expect(useCases.getServices.list).toHaveBeenCalledWith({ page: 1, limit: 10 });
    expect(useCases.getById.execute).toHaveBeenCalledWith('service-id', false);
    expect(useCases.manage.setActive).toHaveBeenCalledWith('service-id', false);
  });
});
