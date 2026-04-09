import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UpdateMaintenanceRecordUseCase } from './update-maintenance-record.use-case';
import { IMaintenanceRecordRepository } from '../../domain/repositories/maintenance-record.repository.interface';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { MaintenanceRecordEntity } from '../../domain/entities/maintenance-record.entity';

describe('UpdateMaintenanceRecordUseCase', () => {
  let useCase: UpdateMaintenanceRecordUseCase;
  let maintenanceRepository: jest.Mocked<IMaintenanceRecordRepository>;
  let vehicleRepository: jest.Mocked<IVehicleRepository>;
  let cacheManager: jest.Mocked<any>;

  const mockRecord: MaintenanceRecordEntity = {
    id: 'mr1',
    vehicleId: 'v1',
    userId: 'user1',
    serviceType: 'تغيير زيت',
    cost: 250,
  } as MaintenanceRecordEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateMaintenanceRecordUseCase,
        {
          provide: IMaintenanceRecordRepository,
          useValue: { findById: jest.fn(), update: jest.fn() },
        },
        {
          provide: IVehicleRepository,
          useValue: { belongsToUser: jest.fn() },
        },
        {
          provide: CACHE_MANAGER,
          useValue: { del: jest.fn(), store: { keys: jest.fn().mockResolvedValue([]) } },
        },
      ],
    }).compile();

    useCase = module.get<UpdateMaintenanceRecordUseCase>(UpdateMaintenanceRecordUseCase);
    maintenanceRepository = module.get(IMaintenanceRecordRepository);
    vehicleRepository = module.get(IVehicleRepository);
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should throw NotFoundException if record not found', async () => {
      maintenanceRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('mr1', { cost: 300 }, 'user1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user does not own vehicle', async () => {
      maintenanceRepository.findById.mockResolvedValue(mockRecord);
      vehicleRepository.belongsToUser.mockResolvedValue(false);

      await expect(useCase.execute('mr1', { cost: 300 }, 'user1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should update record successfully', async () => {
      maintenanceRepository.findById.mockResolvedValue(mockRecord);
      vehicleRepository.belongsToUser.mockResolvedValue(true);
      maintenanceRepository.update.mockResolvedValue({ ...mockRecord, cost: 300 });

      const result = await useCase.execute('mr1', { cost: 300 }, 'user1');

      expect(maintenanceRepository.update).toHaveBeenCalled();
      expect(result.cost).toBe(300);
    });
  });
});
