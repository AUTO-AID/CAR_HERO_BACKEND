import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { GetVehicleMaintenanceUseCase } from './get-vehicle-maintenance.use-case';
import { IMaintenanceRecordRepository } from '../../domain/repositories/maintenance-record.repository.interface';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { MaintenanceRecordEntity } from '../../domain/entities/maintenance-record.entity';

describe('GetVehicleMaintenanceUseCase', () => {
  let useCase: GetVehicleMaintenanceUseCase;
  let maintenanceRepository: jest.Mocked<IMaintenanceRecordRepository>;
  let vehicleRepository: jest.Mocked<IVehicleRepository>;
  let cacheManager: jest.Mocked<any>;

  const mockRecords: MaintenanceRecordEntity[] = [
    {
      id: 'mr1',
      vehicleId: 'v1',
      userId: 'user1',
      serviceType: 'تغيير زيت',
      createdAt: new Date(),
    } as MaintenanceRecordEntity,
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetVehicleMaintenanceUseCase,
        {
          provide: IMaintenanceRecordRepository,
          useValue: { findByVehicleId: jest.fn() },
        },
        {
          provide: IVehicleRepository,
          useValue: { belongsToUser: jest.fn(), findById: jest.fn() },
        },
        {
          provide: CACHE_MANAGER,
          useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() },
        },
      ],
    }).compile();

    useCase = module.get<GetVehicleMaintenanceUseCase>(GetVehicleMaintenanceUseCase);
    maintenanceRepository = module.get(IMaintenanceRecordRepository);
    vehicleRepository = module.get(IVehicleRepository);
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should throw ForbiddenException if user does not own vehicle', async () => {
      vehicleRepository.belongsToUser.mockResolvedValue(false);

      await expect(useCase.execute('v1', 'user1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if vehicle not found', async () => {
      vehicleRepository.belongsToUser.mockResolvedValue(true);
      vehicleRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('v1', 'user1')).rejects.toThrow(NotFoundException);
    });

    it('should return cached results if available', async () => {
      vehicleRepository.belongsToUser.mockResolvedValue(true);
      vehicleRepository.findById.mockResolvedValue({} as any);
      const cached = { records: mockRecords, pagination: { total: 1, page: 1, limit: 20, pages: 1 } };
      cacheManager.get.mockResolvedValue(cached);

      const result = await useCase.execute('v1', 'user1');

      expect(cacheManager.get).toHaveBeenCalled();
      expect(maintenanceRepository.findByVehicleId).not.toHaveBeenCalled();
      expect(result).toEqual(cached);
    });

    it('should fetch records and cache if not cached', async () => {
      vehicleRepository.belongsToUser.mockResolvedValue(true);
      vehicleRepository.findById.mockResolvedValue({} as any);
      cacheManager.get.mockResolvedValue(null);
      maintenanceRepository.findByVehicleId.mockResolvedValue({
        records: mockRecords,
        total: 1,
      });

      const result = await useCase.execute('v1', 'user1');

      expect(maintenanceRepository.findByVehicleId).toHaveBeenCalledWith('v1', 0, 20);
      expect(cacheManager.set).toHaveBeenCalled();
      expect(result.records).toHaveLength(1);
    });
  });
});
